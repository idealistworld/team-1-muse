import { authenticateRequest } from "@/lib/api/route-auth";
import { createLinkedInScraperService } from "@/services/linkedinScraperService";

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);

  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { profileUrls } = await request.json();

    if (!profileUrls || !Array.isArray(profileUrls) || profileUrls.length === 0) {
      return Response.json({ error: "profileUrls array is required" }, { status: 400 });
    }

    const apiToken = process.env.APIFY_API_TOKEN;
    if (!apiToken) {
      return Response.json({ error: "APIFY_API_TOKEN not configured" }, { status: 500 });
    }

    // Use service to handle scraping logic
    const scraperService = createLinkedInScraperService(auth.supabase, apiToken);
    const result = await scraperService.scrapeProfiles(profileUrls, auth.user.id);

    return Response.json(result, { status: 200 });

  } catch (error) {
    console.error("LinkedIn scrape error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
