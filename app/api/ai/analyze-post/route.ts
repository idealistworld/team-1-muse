import { authenticateRequest } from "@/lib/api/route-auth";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_API_KEY,
});

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);

  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { postContent, existingProfile } = await request.json();

    if (!postContent) {
      return Response.json({ error: "Post content is required" }, { status: 400 });
    }

    // Build context about what we already know
    let profileContext = "";
    if (existingProfile && Object.keys(existingProfile).length > 0) {
      const known = Object.entries(existingProfile)
        .filter(([, v]) => v && String(v).trim())
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n');
      if (known) {
        profileContext = `\n\nWE ALREADY KNOW ABOUT THE USER:\n${known}\n\nDO NOT ask about things we already know.`;
      }
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert at analyzing LinkedIn posts to figure out what personal info is needed to rewrite them for someone else.

Your job:
1. Read the post carefully
2. Identify SPECIFIC details that would need to be personalized (company names, metrics, experiences, etc.)
3. Generate 1-3 SHORT, SPECIFIC questions to gather the user's equivalent info

Return a JSON object with:
{
  "analysis": "Brief 1-sentence summary of what this post is about",
  "dataPoints": ["List of specific things in the post that need personalization"],
  "questions": [
    {
      "field": "fieldName",
      "question": "The specific question to ask",
      "why": "Brief reason why we need this"
    }
  ]
}

Available field names: fullName, currentTitle, companyName, industry, productName, targetCustomer, experience, metrics, achievement

Rules:
- Questions should be SPECIFIC to this post, not generic
- If post mentions "$1M ARR", ask about THEIR revenue/metrics
- If post mentions a specific experience, ask about THEIR similar experience
- Max 3 questions
- Keep questions short and conversational
- If post is generic/motivational and we have their name, return empty questions array${profileContext}`
        },
        {
          role: "user",
          content: `Analyze this post:\n\n${postContent}`
        }
      ],
      temperature: 0.3,
    });

    const response = completion.choices[0]?.message?.content?.trim() || '{}';

    // Parse the JSON response
    try {
      const parsed = JSON.parse(response);
      return Response.json({
        analysis: parsed.analysis || "General post",
        dataPoints: parsed.dataPoints || [],
        questions: parsed.questions || [],
      }, { status: 200 });
    } catch {
      return Response.json({
        analysis: "Unable to analyze",
        dataPoints: [],
        questions: [],
      }, { status: 200 });
    }
  } catch (error) {
    console.error("Analyze post error:", error);
    return Response.json(
      { error: "Failed to analyze post", analysis: "", dataPoints: [], questions: [] },
      { status: 500 }
    );
  }
}
