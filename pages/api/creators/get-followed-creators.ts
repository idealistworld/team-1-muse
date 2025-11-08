import { createClient } from "@supabase/supabase-js";
import type { NextApiRequest, NextApiResponse } from "next";
import { creatorService } from "@/services/creatorService";

/**
 * GET /api/creators/get-followed-creators
 * Returns creators that the authenticated user follows
 *
 * Database Schema (from public/supabase_schema.png):
 * - Table: user_follows
 *   - id: uuid (primary key)
 *   - user_id: uuid (foreign key to user_profiles)
 *   - creator_id: int8 (foreign key to creator_profiles)
 *   - created_at: timestamptz
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Get user_id from query parameter
  const { user_id } = req.query;

  if (!user_id || typeof user_id !== "string") {
    return res.status(400).json({ error: "user_id query parameter is required" });
  }

  // Create Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    const creators = await creatorService.getFollowedCreatorsWithProfiles(supabase, user_id);
    return res.status(200).json({ data: creators });
  } catch (error) {
    console.error("Get followed creators error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: errorMessage });
  }
}
