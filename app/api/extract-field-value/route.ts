import { NextResponse } from "next/server";
import OpenAI from "openai";
import { authenticateRequest } from "@/lib/api/route-auth";

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_API_KEY,
});

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);

  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { transcript, fieldLabel } = await request.json();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are extracting structured data from natural language voice input.
The user is filling out a profile form field by field using voice input.
Extract ONLY the relevant value for the requested field from what the user said.
Be concise - extract just the core information, not full sentences.

Examples:
Field: "Current Title" | User says: "I'm the founder" → Extract: "Founder"
Field: "Company Name" | User says: "my company is called Acme Corp" → Extract: "Acme Corp"
Field: "Industry" | User says: "we're in SaaS" → Extract: "SaaS"
Field: "Location" | User says: "I'm based in San Francisco" → Extract: "San Francisco"
Field: "Total Users" | User says: "we have about 1000 users" → Extract: "1000"

Return ONLY the extracted value, nothing else.`,
        },
        {
          role: "user",
          content: `Field: "${fieldLabel}"\nUser said: "${transcript}"\n\nExtract the value:`,
        },
      ],
      temperature: 0.3,
      max_tokens: 100,
    });

    const extractedValue = completion.choices[0]?.message?.content?.trim() || transcript;

    return NextResponse.json({ value: extractedValue });
  } catch (error) {
    console.error("Extract field value error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to extract value", details: errorMessage, value: null },
      { status: 500 }
    );
  }
}
