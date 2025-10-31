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
    prompt?: string
  ): Promise<GenerateEditResponse> {
    const systemPrompt =
      prompt ||
      "You are a content rewriter. Your job is to take ANY text the user provides and rewrite it to be more engaging, clear, and polished. ALWAYS provide a rewritten version - never ask for more information or refuse. Even if the text is short or vague, expand and improve it creatively. Return ONLY the rewritten content with no explanations, questions, or meta-commentary."

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: text,
        },
      ],
      temperature: 0.8, // Higher temperature for more variation
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
