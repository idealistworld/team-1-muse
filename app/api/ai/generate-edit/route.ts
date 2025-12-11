import { authenticateRequest } from "@/lib/api/route-auth";
import { openaiService } from "@/services/openaiService";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);

  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { text, prompt, context, conversationHistory, similarity } = await request.json();

    // Validate text
    if (!text || typeof text !== "string") {
      return Response.json({ error: "Text is required and must be a string" }, { status: 400 });
    }

    // Limit text length (max 50k characters)
    if (text.length > 50000) {
      return Response.json({ error: "Text exceeds maximum length of 50,000 characters" }, { status: 400 });
    }

    // Validate optional prompt
    if (prompt && typeof prompt !== "string") {
      return Response.json({ error: "Prompt must be a string" }, { status: 400 });
    }

    // Validate conversationHistory if provided
    if (conversationHistory && !Array.isArray(conversationHistory)) {
      return Response.json({ error: "conversationHistory must be an array" }, { status: 400 });
    }

    const result = await openaiService.generateEdit(text, prompt, context, conversationHistory, similarity);

    return Response.json(result, { status: 200 });
  } catch (error) {
    logger.error("Generate edit error", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return Response.json(
      {
        error: "Failed to generate edit",
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
