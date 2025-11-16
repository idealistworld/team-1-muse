import { authenticateRequest } from "@/lib/api/route-auth";
import { openaiService } from "@/services/openaiService";

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);

  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { text, voice = "alloy" } = await request.json();

    if (!text) {
      return Response.json({ error: "Text is required" }, { status: 400 });
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
    console.error("Text-to-speech error:", error);
    return Response.json({ error: "Failed to generate speech" }, { status: 500 });
  }
}
