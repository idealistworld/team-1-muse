import { createClient } from "@supabase/supabase-js";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * GET /api/creators/suggested-creators
 * Returns creator profiles the provided user does not follow.
 *
 * Query params:
 * - user_id: uuid of the authenticated user.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { user_id } = req.query;

  if (!user_id || typeof user_id !== "string") {
    return res.status(400).json({ error: "user_id query parameter is required" });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const {
    data: followedCreators,
    error: followedError,
  } = await supabase
    .from("user_follows")
    .select("creator_id")
    .eq("user_id", user_id);

  if (followedError) {
    return res.status(500).json({ error: followedError.message });
  }

  const followedIds = new Set<string>(
    (followedCreators ?? [])
      .map((follow) => follow.creator_id)
      .filter((creatorId) => creatorId !== null && creatorId !== undefined)
      .map((creatorId) => String(creatorId))
  );

  const { data: allCreators, error } = await supabase
    .from("creator_profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  const suggestions = (allCreators ?? []).filter((creator) => {
    const creatorId = creator?.creator_id;
    if (creatorId === null || creatorId === undefined) {
      return false;
    }

    return !followedIds.has(String(creatorId));
  });

  return res.status(200).json({ data: suggestions });
}
