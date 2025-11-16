import { authenticateRequest } from "@/lib/api/route-auth";
import { openaiService } from "@/services/openaiService";

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);

  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { postContent, conversationHistory } = await request.json();

    if (!postContent) {
      return Response.json({ error: "Post content is required" }, { status: 400 });
    }

    console.log(`Asking question (${conversationHistory?.length / 2 || 0} exchanges so far)...`);

    const result = await openaiService.askQuestion(postContent, conversationHistory || []);

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
