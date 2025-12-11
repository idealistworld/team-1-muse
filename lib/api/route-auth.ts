/**
 * API authentication utilities for App Router Route Handlers
 */

import { createClient, SupabaseClient, User } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY!;

type AuthSuccess = {
  supabase: SupabaseClient;
  user: User;
};

type AuthError = {
  error: string;
  status: 401;
};

/**
 * Extract access token from Request headers or cookies
 */
export function extractAccessToken(request: Request): string | undefined {
  const authHeader = request.headers.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length);
  }

  // Check cookies for Supabase auth token
  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split("=");
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    // Supabase stores the access token in a cookie with this pattern
    const accessTokenCookie = Object.keys(cookies).find(key =>
      key.includes("sb-") && key.includes("-auth-token")
    );

    if (accessTokenCookie) {
      try {
        const cookieValue = cookies[accessTokenCookie];

        // Supabase stores cookies as base64-encoded JSON
        if (cookieValue.startsWith("base64-")) {
          const base64Data = cookieValue.slice("base64-".length);
          const decodedValue = Buffer.from(base64Data, "base64").toString("utf-8");
          const tokenData = JSON.parse(decodedValue);
          return tokenData.access_token;
        }

        // Fallback: try parsing as URL-encoded JSON
        const decodedValue = decodeURIComponent(cookieValue);
        const tokenData = JSON.parse(decodedValue);
        return tokenData.access_token;
      } catch (e) {
        logger.error("Failed to parse auth token from cookie", e);
      }
    }
  }

  return undefined;
}

/**
 * Authenticate request and return authenticated Supabase client + user
 * For use in App Router Route Handlers
 */
export async function authenticateRequest(
  request: Request
): Promise<AuthSuccess | AuthError> {
  const token = extractAccessToken(request);

  if (!token) {
    return { error: "Missing access token", status: 401 };
  }

  const supabase = createClient(supabaseUrl, supabaseSecretKey, {
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

/**
 * Create an unauthenticated Supabase client for public endpoints
 * For use in App Router Route Handlers
 */
export function createUnauthenticatedClient(): SupabaseClient {
  return createClient(supabaseUrl, supabaseSecretKey);
}
