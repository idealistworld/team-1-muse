import type { NextApiRequest, NextApiResponse } from "next"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_API_KEY,
})

interface Message {
  role: "assistant" | "user"
  content: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { postContent, conversationHistory } = req.body

    if (!postContent) {
      return res.status(400).json({ error: "Post content is required" })
    }

    const history: Message[] = conversationHistory || []

    console.log(`Asking question (${history.length / 2} exchanges so far)...`)

    const systemPrompt = `You are a helpful assistant gathering context to personalize content for a user.

Your goal: Ask the user questions to understand their background, company, industry, experiences, and audience so you can rewrite the provided post authentically for them.

Rules:
1. ALWAYS ask ONE specific, relevant question at a time
2. Base follow-up questions on their previous answers
3. ONLY after you have asked 3-5 meaningful questions AND received answers, respond with ONLY the text: "READY_TO_GENERATE" (nothing else, no explanation, no pleasantries)
4. If you haven't asked any questions yet, you MUST ask at least one question
5. Don't ask unnecessary questions - be efficient
6. Make questions conversational and natural

Post to personalize:
${postContent}

Current conversation length: ${history.length} messages

${history.length === 0 ? 'START by asking your first question.' : 'Ask your next question or respond with ONLY "READY_TO_GENERATE" if you have asked 3-5 questions and have enough context.'}`

    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...history,
    ]

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
    })

    const response = completion.choices[0]?.message?.content?.trim() || ""

    // Check if response contains READY_TO_GENERATE (be lenient with AI being chatty)
    if (response.includes("READY_TO_GENERATE")) {
      console.log("AI has enough context, ready to generate")
      res.status(200).json({ ready: true })
    } else {
      console.log("AI asking question:", response.substring(0, 100))
      res.status(200).json({ ready: false, question: response })
    }
  } catch (error) {
    console.error("Ask question error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    res.status(500).json({
      error: "Failed to ask question",
      details: errorMessage
    })
  }
}
