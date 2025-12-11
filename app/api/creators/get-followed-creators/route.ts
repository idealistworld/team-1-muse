import { authenticateRequest } from "@/lib/api/route-auth";
import { creatorService } from "@/services/creatorService";
import { logger } from "@/lib/logger";

/**
 * GET /api/creators/get-followed-creators
 * Returns creators that the authenticated user follows
 */
export async function GET(request: Request) {
  const auth = await authenticateRequest(request);

  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const user_id = searchParams.get("user_id");

  if (!user_id || typeof user_id !== "string") {
    return Response.json(
      { error: "user_id query parameter is required" },
      { status: 400 }
    );
  }

  try {
    const creators = await creatorService.getFollowedCreatorsWithProfiles(user_id);
    return Response.json({ data: creators }, { status: 200 });
  } catch (error) {
    logger.error("Get followed creators error", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
