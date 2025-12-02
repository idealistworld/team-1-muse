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
    conversationHistory: Array<{ role: "assistant" | "user"; content: string }>,
    existingContext?: Record<string, string>,
    missingFields?: string[]
  ): Promise<AskQuestionResponse> {
    // Build context section from existing profile data
    let existingDataSection = "";
    if (existingContext && Object.keys(existingContext).length > 0) {
      const contextParts = Object.entries(existingContext)
        .filter(([, value]) => value?.trim())
        .map(([key, value]) => `- ${key}: ${value}`);

      if (contextParts.length > 0) {
        existingDataSection = `\n\nWE ALREADY KNOW THIS ABOUT THE USER (do NOT ask about these):
${contextParts.join("\n")}`;
      }
    }

    // Build missing fields section
    let missingFieldsSection = "";
    if (missingFields && missingFields.length > 0) {
      missingFieldsSection = `\n\nFIELDS WE STILL NEED (prioritize asking about these):
${missingFields.map(f => `- ${f}`).join("\n")}`;
    }

    const systemPrompt = `You are a helpful assistant gathering context to personalize content for a user.

Your goal: Ask the user questions to understand their background, company, industry, experiences, and audience so you can rewrite the provided post authentically for them.
${existingDataSection}
${missingFieldsSection}

CRITICAL: Identify every specific data point in the original post and get the user's version:
- Years/dates (e.g., "graduated in 2018" → ask THEIR graduation year)
- Company names (e.g., "worked at Google" → ask THEIR company)
- Job titles, numbers, metrics, locations
- Personal stories/anecdotes (get THEIR equivalent experience)
- Industry-specific details

DO NOT ask about information we already have. Focus on what's missing and what's needed for this specific post.

Rules:
1. ALWAYS ask ONE specific, relevant question at a time
2. Base follow-up questions on their previous answers
3. ONLY after you have enough context (existing data + answers to 2-4 questions), respond with ONLY: "READY_TO_GENERATE"
4. If we already have good profile data, you can be ready after fewer questions
5. Be thorough - don't skip details that need personalization
6. Make questions conversational and natural

Post to personalize:
${postContent}

Current conversation length: ${conversationHistory.length} messages
${existingDataSection ? `\nWe already have profile data, so fewer questions may be needed.` : ''}

${conversationHistory.length === 0 ? 'START by asking your first question about something we don\'t already know.' : 'Ask your next question or respond with ONLY "READY_TO_GENERATE" if you have enough context.'}`;

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
      return { ready: true };
    } else {
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
    conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>,
    similarity?: number // 0-100, how different from original (higher = more different)
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
    }

    // Build similarity instruction based on the slider value
    // Note: similarity is now 0-100 where 100 = very similar, 0 = very different
    let similarityInstruction = "";
    if (similarity !== undefined) {
      if (similarity >= 70) {
        similarityInstruction = "\n\nSIMILARITY LEVEL: Very similar to original - only make minimal changes to personalize key details while keeping most of the original wording and structure intact.";
      } else if (similarity >= 30) {
        similarityInstruction = "\n\nSIMILARITY LEVEL: Moderate changes - adapt the content significantly while preserving the core message and flow. Rewrite paragraphs in the user's voice.";
      } else {
        similarityInstruction = "\n\nSIMILARITY LEVEL: Very different - significantly rewrite the content to feel completely original to the user while maintaining the core insights. Use different examples, structure, and phrasing.";
      }
    }

    const systemPrompt = prompt
      ? `You are a content editor. The conversation history shows previous edits that have ALREADY been applied. Only apply the LATEST user instruction - do NOT re-apply previous changes. Return ONLY the edited content with no explanations.${contextSection}${similarityInstruction}`
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

Think of this as "translating" the post to the user's world, not writing a new post.${contextSection}${similarityInstruction}`;

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

    // Always include the current text as the first user message
    const textMessage = prompt
      ? `Here is the current text:\n\n${text}\n\nEdit instruction: ${prompt}`
      : `Here is the text to edit:\n\n${text}`;

    messages.push({
      role: "user",
      content: textMessage,
    });

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
    });

    const suggestedText = completion.choices[0]?.message?.content || "";

    // Calculate actual additions/deletions by comparing words
    const originalWords = new Set(text.toLowerCase().split(/\s+/));
    const suggestedWords = new Set(suggestedText.toLowerCase().split(/\s+/));

    let additions = 0;
    let deletions = 0;

    // Count words in suggested that aren't in original (additions)
    suggestedWords.forEach(word => {
      if (!originalWords.has(word)) additions++;
    });

    // Count words in original that aren't in suggested (deletions)
    originalWords.forEach(word => {
      if (!suggestedWords.has(word)) deletions++;
    });

    return {
      originalText: text,
      suggestedText,
      additions,
      deletions,
    };
  }
}

export const openaiService = new OpenAIService();
