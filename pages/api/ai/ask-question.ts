import type { NextApiRequest, NextApiResponse } from "next"
import { openaiService } from "@/services/openaiService"

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

    console.log(`Asking question (${conversationHistory?.length / 2 || 0} exchanges so far)...`)

    const result = await openaiService.askQuestion(postContent, conversationHistory || [])

    res.status(200).json(result)
  } catch (error) {
    console.error("Ask question error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    res.status(500).json({
      error: "Failed to ask question",
      details: errorMessage
    })
  }
}
