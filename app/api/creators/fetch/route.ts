import { authenticateRequest } from "@/lib/api/route-auth";
import { contentService } from "@/services/contentService";
import { logger } from "@/lib/logger";

/**
 * GET /api/creators/fetch
 * Fetch all creators with stats and follow status
 * Query params: user_id (optional)
 */
export async function GET(request: Request) {
  const auth = await authenticateRequest(request);

  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id") || undefined;

    const data = await contentService.fetchCreators(userId);
    return Response.json({ data }, { status: 200 });
  } catch (error) {
    logger.error("Fetch creators error", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
