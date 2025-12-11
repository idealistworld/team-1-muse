import { authenticateRequest } from "@/lib/api/route-auth";
import { contentService } from "@/services/contentService";
import { logger } from "@/lib/logger";

/**
 * GET /api/content/fetch
 * Fetch creator content with optional pagination
 * Query params: limit, offset
 */
export async function GET(request: Request) {
  const auth = await authenticateRequest(request);

  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");

    const options = {
      limit: limit ? parseInt(limit, 10) : 1000,
      offset: offset ? parseInt(offset, 10) : 0,
    };

    const data = await contentService.fetchCreatorContent(options);
    return Response.json({ data }, { status: 200 });
  } catch (error) {
    logger.error("Fetch content error", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
