import { createClient } from "@supabase/supabase-js";
import type { NextApiRequest, NextApiResponse } from "next";

interface UnfollowRequestBody {
  creatorId?: number;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function extractAccessToken(req: NextApiRequest) {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length);
  }

  return req.cookies["sb-access-token"];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = extractAccessToken(req);

  if (!token) {
    return res.status(401).json({ error: "Missing access token" });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const { data: userData, error: authError } = await supabase.auth.getUser(
    token
  );

  if (authError || !userData?.user) {
    return res
      .status(401)
      .json({ error: authError?.message ?? "Invalid access token" });
  }

  const body = req.body as UnfollowRequestBody;
  const creatorId = Number(body?.creatorId);

  if (!Number.isFinite(creatorId)) {
    return res.status(400).json({ error: "creatorId is required" });
  }

  const { error } = await supabase
    .from("user_follows")
    .delete()
    .match({ user_id: userData.user.id, creator_id: creatorId });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ data: { user_id: userData.user.id, creator_id: creatorId }, isFollowed: false });
}
