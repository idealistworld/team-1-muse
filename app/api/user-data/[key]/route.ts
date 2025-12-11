import { authenticateRequest } from "@/lib/api/route-auth";
import { userDataService } from "@/services/userDataService";
import { logger } from "@/lib/logger";

interface RouteContext {
  params: Promise<{ key: string }>;
}

/**
 * GET /api/user-data/[key]
 * Fetch user data by key
 * Query params: user_id (required)
 */
export async function GET(request: Request, context: RouteContext) {
  const auth = await authenticateRequest(request);

  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { key } = await context.params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return Response.json(
        { error: "user_id query parameter is required" },
        { status: 400 }
      );
    }

    logger.info(`Loading user data: userId=${userId}, key=${key}`);
    const data = await userDataService.loadData(userId, key);
    logger.info(`User data result:`, { userId, key, hasData: !!data });
    return Response.json({ data }, { status: 200 });
  } catch (error) {
    logger.error("Fetch user data error", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * PUT /api/user-data/[key]
 * Upsert user data
 * Body: { userId, data }
 */
export async function PUT(request: Request, context: RouteContext) {
  const auth = await authenticateRequest(request);

  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { key } = await context.params;
    const body = await request.json();
    const { userId, data } = body;

    if (!userId || !data) {
      return Response.json(
        { error: "userId and data are required" },
        { status: 400 }
      );
    }

    await userDataService.saveData(userId, key, data);
    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    logger.error("Save user data error", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
