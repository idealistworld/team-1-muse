import { authenticateRequest } from "@/lib/api/route-auth";
import { openaiService } from "@/services/openaiService";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);

  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { postContent, conversationHistory, existingContext, missingFields } = await request.json();

    // Validate postContent
    if (!postContent || typeof postContent !== "string") {
      return Response.json({ error: "Post content is required and must be a string" }, { status: 400 });
    }

    // Limit content length
    if (postContent.length > 50000) {
      return Response.json({ error: "Post content exceeds maximum length of 50,000 characters" }, { status: 400 });
    }

    // Validate conversationHistory
    if (conversationHistory && !Array.isArray(conversationHistory)) {
      return Response.json({ error: "conversationHistory must be an array" }, { status: 400 });
    }

    // Limit conversation history length
    if (conversationHistory && conversationHistory.length > 50) {
      return Response.json({ error: "conversationHistory exceeds maximum of 50 messages" }, { status: 400 });
    }

    const result = await openaiService.askQuestion(
      postContent,
      conversationHistory || [],
      existingContext,
      missingFields
    );

    return Response.json(result, { status: 200 });
  } catch (error) {
    logger.error("Ask question error", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return Response.json(
      {
        error: "Failed to ask question",
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
