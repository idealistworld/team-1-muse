import { authenticateRequest } from "@/lib/api/route-auth";
import { contentService } from "@/services/contentService";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);

  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const data = await contentService.getAllCreatorContent();
    return Response.json({ data }, { status: 200 });
  } catch (error) {
    logger.error("Get all posts error", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
