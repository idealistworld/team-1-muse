import { authenticateRequest } from "@/lib/api/route-auth";
import { openaiService } from "@/services/openaiService";

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);

  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { postContent, conversationHistory, existingContext, missingFields } = await request.json();

    if (!postContent) {
      return Response.json({ error: "Post content is required" }, { status: 400 });
    }

    const result = await openaiService.askQuestion(
      postContent,
      conversationHistory || [],
      existingContext,
      missingFields
    );

    return Response.json(result, { status: 200 });
  } catch (error) {
    console.error("Ask question error:", error);
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
