import OpenAI from "openai";
import type { GenerateEditResponse, AskQuestionResponse } from "@/types/api";
import type { ProfileData } from "@/types";

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
3. You MUST ask at least 1-2 questions, even if we have profile data (post-specific context is important)
4. After 2-4 questions total, respond with ONLY: "READY_TO_GENERATE"
5. Focus on post-specific details that aren't in the profile (stories, examples, metrics)
6. Make questions conversational and natural

Post to personalize:
${postContent}

Current conversation length: ${conversationHistory.length} messages
${existingDataSection ? `\nWe have profile data, but you MUST still ask 1-2 questions about post-specific details.` : ''}

${conversationHistory.length === 0 ? 'START by asking your first question about post-specific context (stories, examples, metrics, experiences).' : conversationHistory.length < 2 ? 'Continue asking questions - you need at least 2 total.' : 'Ask your next question or respond with ONLY "READY_TO_GENERATE" if you have enough context (minimum 2 questions asked).'}`;

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

    // Build similarity instruction
    let similarityInstruction = "";
    if (similarity !== undefined) {
      const extraInstructions = similarity < 30
        ? `\n\nBECAUSE THIS IS BELOW 30% SIMILARITY:
- Completely restructure the post - don't follow the original's flow
- Use different sentence structures and lengths throughout
- Change the opening hook entirely
- Rearrange the order of ideas
- Rewrite every sentence from scratch - no copy-pasting phrases
- Make it feel like a completely different post about the same topic`
        : "";

      similarityInstruction = `\n\nYOU ARE A COPY TRADER: Extract the core best parts and winning patterns from the original, but never plagiarize.

KEEP: The same subject matter, topic, and core insights.

SIMILARITY LEVEL: Make the output ${similarity}% similar to the original in terms of:
- Structure and layout
- Sentence patterns
- Word choice and phrasing

At ${similarity}% similarity, adjust how much you change the structure, sentences, and words accordingly. Lower percentages = more different from the original.${extraInstructions}`;
    }

    const systemPrompt = prompt
      ? `You are a content editor. The conversation history shows previous edits that have ALREADY been applied. Only apply the LATEST user instruction - do NOT re-apply previous changes. Return ONLY the edited content with no explanations.${contextSection}${similarityInstruction}`
      : context && Object.keys(context).length > 0
      ? `You are a content personalization expert. Your job is to adapt the provided post to make it feel like it was written BY the user FOR their specific audience.

IMPORTANT RULES:
1. KEEP the core message, story, and insights from the original post
2. ADAPT the details, examples, and framing to match the user's context
3. If the original mentions a specific company/industry, replace it with the user's company/industry
4. If the original has a personal story, adapt it to feel like the user's experience
5. Maintain the same tone and structure as the original
6. DO NOT invent completely new ideas - stay true to the original post's message
7. Make it feel authentic to the user's background and audience
8. KEEP approximately the same word count as the original (within 10-20%)

Think of this as "translating" the post to the user's world, not writing a new post.${contextSection}${similarityInstruction}`
      : `You are a copy trader. Your job is to rewrite the provided post based on the similarity level, keeping the same examples, stories, and companies from the original.

IMPORTANT RULES:
1. DO NOT add placeholders like [Your Company Name] or [Your Industry]
2. KEEP the same examples, companies, and stories from the original (e.g., if it mentions Celsius, keep Celsius)
3. Rewrite the structure, sentences, and wording based on the similarity percentage
4. The goal is to learn from the winning pattern, not personalize it
5. KEEP approximately the same word count as the original (within 10-20%)${similarityInstruction}`;

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

  async analyzePost(postContent: string, existingProfile?: Partial<ProfileData>) {
    // Build context about what we already know
    let profileContext = "";
    if (existingProfile && Object.keys(existingProfile).length > 0) {
      const known = Object.entries(existingProfile)
        .filter(([, v]) => v && String(v).trim())
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n');
      if (known) {
        profileContext = `\n\nWE ALREADY KNOW ABOUT THE USER:\n${known}\n\nDO NOT ask about things we already know.`;
      }
    }

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert at analyzing LinkedIn posts to figure out what personal info is needed to rewrite them for someone else.

Your job:
1. Read the post carefully
2. Identify SPECIFIC details that would need to be personalized (company names, metrics, experiences, etc.)
3. Generate 1-3 SHORT, SPECIFIC questions to gather the user's equivalent info

Return a JSON object with:
{
  "analysis": "Brief 1-sentence summary of what this post is about",
  "dataPoints": ["List of specific things in the post that need personalization"],
  "questions": [
    {
      "field": "fieldName",
      "question": "The specific question to ask",
      "why": "Brief reason why we need this"
    }
  ]
}

Available field names: fullName, currentTitle, companyName, industry, productName, targetCustomer, experience, metrics, achievement

Rules:
- Questions should be SPECIFIC to this post, not generic
- If post mentions "$1M ARR", ask about THEIR revenue/metrics
- If post mentions a specific experience, ask about THEIR similar experience
- Max 3 questions
- Keep questions short and conversational
- If post is generic/motivational and we have their name, return empty questions array${profileContext}`
        },
        {
          role: "user",
          content: `Analyze this post:\n\n${postContent}`
        }
      ],
      temperature: 0.3,
    });

    const response = completion.choices[0]?.message?.content?.trim() || '{}';

    // Parse the JSON response
    try {
      const parsed = JSON.parse(response);
      return {
        analysis: parsed.analysis || "General post",
        dataPoints: parsed.dataPoints || [],
        questions: parsed.questions || [],
      };
    } catch {
      return {
        analysis: "Unable to analyze",
        dataPoints: [],
        questions: [],
      };
    }
  }

  async extractFieldValue(transcript: string, fieldLabel: string): Promise<string> {
    const completion = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are extracting structured data from natural language voice input.
The user is filling out a profile form field by field using voice input.
Extract ONLY the relevant value for the requested field from what the user said.
Be concise - extract just the core information, not full sentences.

Examples:
Field: "Current Title" | User says: "I'm the founder" → Extract: "Founder"
Field: "Company Name" | User says: "my company is called Acme Corp" → Extract: "Acme Corp"
Field: "Industry" | User says: "we're in SaaS" → Extract: "SaaS"
Field: "Location" | User says: "I'm based in San Francisco" → Extract: "San Francisco"
Field: "Total Users" | User says: "we have about 1000 users" → Extract: "1000"

Return ONLY the extracted value, nothing else.`
        },
        {
          role: "user",
          content: `Field: "${fieldLabel}"\nUser said: "${transcript}"\n\nExtract the value:`
        }
      ],
      temperature: 0.3,
      max_tokens: 100,
    });

    return completion.choices[0]?.message?.content?.trim() || transcript;
  }
}

export const openaiService = new OpenAIService();
