import { authenticateRequest } from "@/lib/api/route-auth";
import { userPostService } from "@/services/userPostService";
import { logger } from "@/lib/logger";

interface RouteContext {
  params: Promise<{ postId: string }>;
}

/**
 * GET /api/user-posts/[postId]
 * Fetch a single post by ID
 */
export async function GET(request: Request, context: RouteContext) {
  const auth = await authenticateRequest(request);

  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { postId } = await context.params;

    const data = await userPostService.fetchPostById(postId);

    if (!data) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    return Response.json({ data }, { status: 200 });
  } catch (error) {
    logger.error("Fetch post error", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * PATCH /api/user-posts/[postId]
 * Update a post
 * Body: { title?, rawText?, status? }
 */
export async function PATCH(request: Request, context: RouteContext) {
  const auth = await authenticateRequest(request);

  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { postId } = await context.params;
    const body = await request.json();

    const data = await userPostService.updatePost(postId, body);
    return Response.json({ data }, { status: 200 });
  } catch (error) {
    logger.error("Update post error", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * DELETE /api/user-posts/[postId]
 * Delete a post
 */
export async function DELETE(request: Request, context: RouteContext) {
  const auth = await authenticateRequest(request);

  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { postId } = await context.params;

    await userPostService.deletePost(postId);
    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    logger.error("Delete post error", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
