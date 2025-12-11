import { authenticateRequest } from "@/lib/api/route-auth";
import { openaiService } from "@/services/openaiService";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);

  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { text, voice = "alloy" } = await request.json();

    // Validate text
    if (!text || typeof text !== "string") {
      return Response.json({ error: "Text is required and must be a string" }, { status: 400 });
    }

    // Limit text length (OpenAI TTS has max ~4096 chars)
    if (text.length > 4096) {
      return Response.json({ error: "Text exceeds maximum length of 4,096 characters" }, { status: 400 });
    }

    // Validate voice parameter
    const validVoices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];
    if (voice && !validVoices.includes(voice)) {
      return Response.json({ error: `Invalid voice. Must be one of: ${validVoices.join(", ")}` }, { status: 400 });
    }

    const buffer = await openaiService.generateSpeech(text, voice);

    // Convert Buffer to Uint8Array for Response
    const uint8Array = new Uint8Array(buffer);

    return new Response(uint8Array, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    logger.error("Text-to-speech error", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return Response.json(
      { error: "Failed to generate speech", details: errorMessage },
      { status: 500 }
    );
  }
}
