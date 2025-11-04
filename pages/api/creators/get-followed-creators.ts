import { createClient } from "@supabase/supabase-js";
import type { NextApiRequest, NextApiResponse } from "next";

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

  // Query creator_profiles that the user follows
  // This joins user_follows with creator_profiles
  const { data, error } = await supabase
    .from("user_follows")
    .select(`
      creator_id,
      created_at,
      creator_profiles (*)
    `)
    .eq("user_id", user_id)
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  // Extract the creator_profiles from the joined data
  const creators = data?.map((follow) => follow.creator_profiles) || [];

  return res.status(200).json({ data: creators });
}
