import { authenticateRequest } from "@/lib/api/route-auth";
import { userPostService } from "@/services/userPostService";
import { logger } from "@/lib/logger";

/**
 * GET /api/user-posts
 * Fetch all posts for a user
 * Query params: user_id (required)
 */
export async function GET(request: Request) {
  const auth = await authenticateRequest(request);

  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return Response.json(
        { error: "user_id query parameter is required" },
        { status: 400 }
      );
    }

    const data = await userPostService.fetchUserPosts(userId);
    return Response.json({ data }, { status: 200 });
  } catch (error) {
    logger.error("Fetch user posts error", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * POST /api/user-posts
 * Create a new post
 * Body: { userId, title?, rawText?, status? }
 */
export async function POST(request: Request) {
  const auth = await authenticateRequest(request);

  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { userId, rawText, status } = body;

    if (!userId) {
      return Response.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const data = await userPostService.createPost(userId, {
      rawText,
      status,
    });

    return Response.json({ data }, { status: 201 });
  } catch (error) {
    logger.error("Create user post error", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
