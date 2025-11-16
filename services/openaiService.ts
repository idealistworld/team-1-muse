import OpenAI from "openai";
import type { GenerateEditResponse, AskQuestionResponse } from "@/types/api";

export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPEN_AI_API_KEY,
    });
  }

  async generateSpeech(
    text: string,
    voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" = "alloy"
  ): Promise<Buffer> {
    const mp3 = await this.openai.audio.speech.create({
      model: "tts-1",
      voice,
      input: text,
    });

    return Buffer.from(await mp3.arrayBuffer());
  }

  async askQuestion(
    postContent: string,
    conversationHistory: Array<{ role: "assistant" | "user"; content: string }>
  ): Promise<AskQuestionResponse> {
    const systemPrompt = `You are a helpful assistant gathering context to personalize content for a user.

Your goal: Ask the user questions to understand their background, company, industry, experiences, and audience so you can rewrite the provided post authentically for them.

CRITICAL: Identify every specific data point in the original post and get the user's version:
- Years/dates (e.g., "graduated in 2018" → ask THEIR graduation year)
- Company names (e.g., "worked at Google" → ask THEIR company)
- Job titles, numbers, metrics, locations
- Personal stories/anecdotes (get THEIR equivalent experience)
- Industry-specific details

DO NOT leave ANY detail unverified. If the post mentions a specific fact, you MUST ask for the user's version.

Rules:
1. ALWAYS ask ONE specific, relevant question at a time
2. Base follow-up questions on their previous answers
3. ONLY after you have verified ALL key data points AND asked 3-5 questions, respond with ONLY: "READY_TO_GENERATE"
4. If you haven't asked any questions yet, you MUST ask at least one question
5. Be thorough - don't skip details that need personalization
6. Make questions conversational and natural

Post to personalize:
${postContent}

Current conversation length: ${conversationHistory.length} messages

${conversationHistory.length === 0 ? 'START by asking your first question.' : 'Ask your next question or respond with ONLY "READY_TO_GENERATE" if you have asked 3-5 questions and have enough context.'}`;

    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...conversationHistory,
    ];

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content?.trim() || "";

    // Check if response contains READY_TO_GENERATE (be lenient with AI being chatty)
    if (response.includes("READY_TO_GENERATE")) {
      console.log("AI has enough context, ready to generate");
      return { ready: true };
    } else {
      console.log("AI asking question:", response.substring(0, 100));
      return { ready: false, question: response };
    }
  }

  async generateEdit(
    text: string,
    prompt?: string,
    context?: {
      company?: string;
      industry?: string;
      targetAudience?: string;
      personalExperience?: string;
      writingStyle?: string;
    },
    conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>
  ): Promise<GenerateEditResponse> {
    let contextSection = "";
    if (context && Object.keys(context).length > 0) {
      const parts = Object.entries(context).map(([key, value]) => {
        // If key looks like a question (contains "?"), format as Q&A
        if (key.includes("?")) {
          return `Q: ${key}\nA: ${value}`;
        }
        // Otherwise format as key-value
        return `${key}: ${value}`;
      });

      contextSection = `\n\nIMPORTANT USER CONTEXT:\n${parts.join(
        "\n\n"
      )}\n\nUse this context to make the content authentic, personalized, and relevant to the user's specific situation.`;
    } else {
      console.log("⚠️ No context provided to GPT");
    }

    const systemPrompt = prompt
      ? `You are a content editor. The conversation history shows previous edits that have ALREADY been applied. Only apply the LATEST user instruction - do NOT re-apply previous changes. Return ONLY the edited content with no explanations.${contextSection}`
      : `You are a content personalization expert. Your job is to adapt the provided post to make it feel like it was written BY the user FOR their specific audience.

IMPORTANT RULES:
1. KEEP the core message, story, and insights from the original post
2. ADAPT the details, examples, and framing to match the user's context
3. If the original mentions a specific company/industry, replace it with the user's company/industry
4. If the original has a personal story, adapt it to feel like the user's experience
5. Maintain the same tone and structure as the original
6. DO NOT invent completely new ideas - stay true to the original post's message
7. Make it feel authentic to the user's background and audience
8. KEEP approximately the same word count as the original (within 10-20%)

Think of this as "translating" the post to the user's world, not writing a new post.${contextSection}`;

    // Build messages array
    const messages: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }> = [
      {
        role: "system",
        content: systemPrompt,
      },
    ];

    // If we have conversation history, use it
    if (conversationHistory && conversationHistory.length > 0) {
      // Just add the conversation history - the text parameter should already be the current version
      conversationHistory.forEach((msg) => {
        messages.push({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content,
        });
      });
    } else {
      // No conversation history, use single-turn format
      const userMessage = prompt
        ? `Here is the text:\n\n${text}\n\nInstructions: ${prompt}`
        : text;

      messages.push({
        role: "user",
        content: userMessage,
      });
    }

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
    });

    const suggestedText = completion.choices[0]?.message?.content || "";

    // Calculate rough additions/deletions
    const originalWords = text.split(/\s+/).length;
    const suggestedWords = suggestedText.split(/\s+/).length;
    const additions = Math.max(0, suggestedWords - originalWords);
    const deletions = Math.max(0, originalWords - suggestedWords);

    return {
      originalText: text,
      suggestedText,
      additions,
      deletions,
    };
  }
}

export const openaiService = new OpenAIService();
