import { authenticateRequest } from "@/lib/api/route-auth";
import { openaiService } from "@/services/openaiService";

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);

  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { text, prompt, context, conversationHistory } = await request.json();

    if (!text) {
      return Response.json({ error: "Text is required" }, { status: 400 });
    }

    console.log("Generating edit for text:", text.substring(0, 100) + "...");
    if (context) {
      console.log("Using context:", Object.keys(context).join(", "));
    }
    if (conversationHistory && conversationHistory.length > 0) {
      console.log("Using conversation history:", conversationHistory.length, "messages");
    }

    const result = await openaiService.generateEdit(text, prompt, context, conversationHistory);

    console.log("Edit generated successfully");

    return Response.json(result, { status: 200 });
  } catch (error) {
    console.error("Generate edit error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return Response.json(
      {
        error: "Failed to generate edit",
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
