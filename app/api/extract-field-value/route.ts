import { authenticateRequest } from "@/lib/api/route-auth";
import { logger } from "@/lib/logger";
import { openaiService } from "@/services/openaiService";

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);

  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { transcript, fieldLabel } = await request.json();

    // Validate transcript
    if (!transcript || typeof transcript !== "string") {
      return Response.json({ error: "Transcript is required and must be a string" }, { status: 400 });
    }

    // Limit transcript length
    if (transcript.length > 5000) {
      return Response.json({ error: "Transcript exceeds maximum length of 5,000 characters" }, { status: 400 });
    }

    // Validate fieldLabel
    if (!fieldLabel || typeof fieldLabel !== "string") {
      return Response.json({ error: "Field label is required and must be a string" }, { status: 400 });
    }

    const extractedValue = await openaiService.extractFieldValue(transcript, fieldLabel);

    return Response.json({ value: extractedValue });
  } catch (error) {
    logger.error("Extract field value error", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return Response.json(
      { error: "Failed to extract value", details: errorMessage, value: null },
      { status: 500 }
    );
  }
}
