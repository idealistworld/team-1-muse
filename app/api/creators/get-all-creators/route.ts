import { authenticateRequest } from "@/lib/api/route-auth";
import { creatorService } from "@/services/creatorService";

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);

  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const data = await creatorService.getAllCreators(auth.supabase);
    return Response.json({ data }, { status: 200 });
  } catch (error) {
    console.error("Get all creators error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
