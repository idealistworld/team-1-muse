import OpenAI from "openai"

export interface GenerateEditResponse {
  originalText: string
  suggestedText: string
  additions: number
  deletions: number
}

export class OpenAIService {
  private openai: OpenAI

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPEN_AI_API_KEY,
    })
  }

  async generateSpeech(
    text: string,
    voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" = "alloy"
  ): Promise<Buffer> {
    const mp3 = await this.openai.audio.speech.create({
      model: "tts-1",
      voice,
      input: text,
    })

    return Buffer.from(await mp3.arrayBuffer())
  }

  async generateEdit(
    text: string,
    prompt?: string,
    context?: {
      company?: string
      industry?: string
      targetAudience?: string
      personalExperience?: string
      writingStyle?: string
    },
    conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>
  ): Promise<GenerateEditResponse> {
    let contextSection = ""
    if (context && Object.keys(context).length > 0) {
      const parts = Object.entries(context).map(([key, value]) => {
        // If key looks like a question (contains "?"), format as Q&A
        if (key.includes("?")) {
          return `Q: ${key}\nA: ${value}`
        }
        // Otherwise format as key-value
        return `${key}: ${value}`
      });

      contextSection = `\n\nIMPORTANT USER CONTEXT:\n${parts.join("\n\n")}\n\nUse this context to make the content authentic, personalized, and relevant to the user's specific situation.`

      console.log("=== GPT CONTEXT SECTION ===");
      console.log(contextSection);
      console.log("===========================");
    } else {
      console.log("⚠️ No context provided to GPT");
    }

    const systemPrompt = prompt
      ? `You are a content editor. The user will give you some text and instructions on what to change. Make ONLY the specific changes they request - do not rewrite the entire thing. Keep as much of the original text as possible and only modify what's needed based on their feedback. Return ONLY the edited content with no explanations.${contextSection}`
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

Think of this as "translating" the post to the user's world, not writing a new post.${contextSection}`

    // Build messages array
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      {
        role: "system",
        content: systemPrompt,
      }
    ];

    // If we have conversation history, use it
    if (conversationHistory && conversationHistory.length > 0) {
      // Add original text as context
      messages.push({
        role: "user",
        content: `Here is the original text I'm working with:\n\n${text}`,
      });

      // Add the conversation history
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
    })

    const suggestedText = completion.choices[0]?.message?.content || ""

    // Calculate rough additions/deletions
    const originalWords = text.split(/\s+/).length
    const suggestedWords = suggestedText.split(/\s+/).length
    const additions = Math.max(0, suggestedWords - originalWords)
    const deletions = Math.max(0, originalWords - suggestedWords)

    return {
      originalText: text,
      suggestedText,
      additions,
      deletions,
    }
  }
}

export const openaiService = new OpenAIService()
