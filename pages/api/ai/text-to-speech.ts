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
    const { text, voice = "alloy" } = req.body

    if (!text) {
      return res.status(400).json({ error: "Text is required" })
    }

    const buffer = await openaiService.generateSpeech(text, voice)

    res.setHeader("Content-Type", "audio/mpeg")
    res.setHeader("Content-Length", buffer.length.toString())
    res.send(buffer)
  } catch (error) {
    console.error("Text-to-speech error:", error)
    res.status(500).json({ error: "Failed to generate speech" })
  }
}
