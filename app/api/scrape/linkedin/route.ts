import { authenticateRequest } from "@/lib/api/route-auth";
import { linkedInScraperService } from "@/services/linkedinScraperService";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);

  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { profileUrls } = await request.json();

    // Validate profileUrls array
    if (!profileUrls || !Array.isArray(profileUrls) || profileUrls.length === 0) {
      return Response.json({ error: "profileUrls array is required" }, { status: 400 });
    }

    // Limit to prevent DoS
    if (profileUrls.length > 50) {
      return Response.json({ error: "Maximum 50 profiles per request" }, { status: 400 });
    }

    // Validate each URL
    for (const url of profileUrls) {
      if (typeof url !== "string" || !url.trim()) {
        return Response.json({ error: "All profileUrls must be non-empty strings" }, { status: 400 });
      }

      // Basic LinkedIn URL validation
      if (!url.includes("linkedin.com/")) {
        return Response.json({ error: "All URLs must be LinkedIn profile URLs" }, { status: 400 });
      }
    }

    // Use service to handle scraping logic
    const result = await linkedInScraperService.scrapeProfiles(profileUrls, auth.user.id);

    return Response.json(result, { status: 200 });

  } catch (error) {
    logger.error("LinkedIn scrape error", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
