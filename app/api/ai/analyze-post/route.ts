import { authenticateRequest } from "@/lib/api/route-auth";
import { logger } from "@/lib/logger";
import { openaiService } from "@/services/openaiService";

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);

  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { postContent, existingProfile } = await request.json();

    // Validate postContent
    if (!postContent || typeof postContent !== "string") {
      return Response.json({ error: "Post content is required and must be a string" }, { status: 400 });
    }

    // Limit content length
    if (postContent.length > 50000) {
      return Response.json({ error: "Post content exceeds maximum length of 50,000 characters" }, { status: 400 });
    }

    const result = await openaiService.analyzePost(postContent, existingProfile);
    return Response.json(result, { status: 200 });
  } catch (error) {
    logger.error("Analyze post error", error);
    return Response.json(
      { error: "Failed to analyze post", analysis: "", dataPoints: [], questions: [] },
      { status: 500 }
    );
  }
}
