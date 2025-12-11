import { authenticateRequest } from "@/lib/api/route-auth";
import { creatorService } from "@/services/creatorService";
import { logger } from "@/lib/logger";

interface UnfollowRequestBody {
  creatorId?: number;
}

export async function DELETE(request: Request) {
  const auth = await authenticateRequest(request);

  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json() as UnfollowRequestBody;
  const creatorId = Number(body?.creatorId);

  if (!Number.isFinite(creatorId)) {
    return Response.json({ error: "creatorId is required" }, { status: 400 });
  }

  try {
    const result = await creatorService.unfollowCreator(auth.user.id, creatorId);
    return Response.json(result, { status: 200 });
  } catch (error) {
    logger.error("Unfollow creator error", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
