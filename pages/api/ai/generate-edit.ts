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
    const { text, prompt } = req.body

    if (!text) {
      return res.status(400).json({ error: "Text is required" })
    }

    console.log("Generating edit for text:", text.substring(0, 100) + "...")

    const result = await openaiService.generateEdit(text, prompt)

    console.log("Edit generated successfully")

    res.status(200).json(result)
  } catch (error) {
    console.error("Generate edit error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    res.status(500).json({
      error: "Failed to generate edit",
      details: errorMessage
    })
  }
}
