/**
 * API authentication utilities
 */

import { createClient } from "@supabase/supabase-js";
import type { NextApiRequest } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Extract access token from request headers or cookies
 */
export function extractAccessToken(req: NextApiRequest): string | undefined {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length);
  }

  return req.cookies["sb-access-token"];
}

/**
 * Authenticate request and return authenticated Supabase client + user
 */
export async function authenticateRequest(req: NextApiRequest) {
  const token = extractAccessToken(req);

  if (!token) {
    return { error: "Missing access token", status: 401 };
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
    return {
      error: authError?.message ?? "Invalid access token",
      status: 401,
    };
  }

  return {
    supabase,
    user: userData.user,
  };
}
