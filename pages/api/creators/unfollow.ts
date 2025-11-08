import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateRequest } from "@/lib/api/auth";
import { creatorService } from "@/services/creatorService";

interface UnfollowRequestBody {
  creatorId?: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = await authenticateRequest(req);

  if ("error" in auth) {
    return res.status(auth.status).json({ error: auth.error });
  }

  const body = req.body as UnfollowRequestBody;
  const creatorId = Number(body?.creatorId);

  if (!Number.isFinite(creatorId)) {
    return res.status(400).json({ error: "creatorId is required" });
  }

  try {
    const result = await creatorService.unfollowCreator(
      auth.supabase,
      auth.user.id,
      creatorId
    );
    return res.status(200).json(result);
  } catch (error) {
    console.error("Unfollow creator error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: errorMessage });
  }
}
