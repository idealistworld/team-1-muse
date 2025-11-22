import { authenticateRequest } from "@/lib/api/route-auth";

const APIFY_ACTOR_ID = "apimaestro~linkedin-profile-posts";

interface ApiMaestroPost {
  urn: string;
  full_urn: string;
  posted_at: {
    date: string;
    relative: string;
    timestamp: number;
  };
  text: string;
  url: string;
  post_type: string;
  author: {
    first_name: string;
    last_name: string;
    headline: string;
    username: string;
    profile_url: string;
    profile_picture: string;
  };
  stats: {
    total_reactions: number;
    like: number;
    comments: number;
    reposts: number;
  };
  media?: {
    type: string;
    url: string;
  };
  article?: {
    url: string;
    title: string;
  };
}


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

    // Process each profile URL
    const allPosts: ApiMaestroPost[] = [];

    for (const profileUrl of profileUrls) {
      // Extract username from URL (e.g., linkedin.com/in/satyanadella -> satyanadella)
      const urlMatch = profileUrl.match(/linkedin\.com\/in\/([^\/\?]+)/);
      const username = urlMatch ? urlMatch[1] : profileUrl;

      const inputBody = {
        username: username,
      };

      const runResponse = await fetch(
        `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/run-sync-get-dataset-items?token=${apiToken}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(inputBody),
        }
      );

      const responseText = await runResponse.text();

      if (!runResponse.ok) {
        console.error(`Apify error for ${username}:`, responseText.slice(0, 500));
        continue;
      }

      if (!responseText || responseText.trim() === "") {
        console.error(`Empty response for ${username}`);
        continue;
      }

      try {
        const results = JSON.parse(responseText);

        // Handle wrapped response format: [{ success, data: { posts } }]
        if (results[0]?.success && results[0]?.data?.posts) {
          const posts = results[0].data.posts;
          allPosts.push(...posts);
        }
        // Handle direct posts format: [{ urn, text, ... }, ...]
        else if (results[0]?.urn || results[0]?.text) {
          allPosts.push(...results);
        }
        // Handle single response object (not array): { success, data: { posts } }
        else if (results?.success && results?.data?.posts) {
          allPosts.push(...results.data.posts);
        }
        // Unexpected format - log for debugging
        else {
          console.error(`Unexpected Apify response format for ${username}`);
        }
      } catch {
        console.error(`Invalid JSON response for ${username}`);
      }
    }

    if (allPosts.length === 0) {
      return Response.json({
        success: false,
        error: "No posts found for any profile",
        urlsSent: profileUrls
      }, { status: 200 });
    }

    // Track created/found creators to auto-follow
    const creatorIds = new Set<number>();

    // Save posts to database
    for (const post of allPosts) {
      // Clean up the profile URL - remove query params
      const rawProfileUrl = post.author?.profile_url || "";
      const authorProfileUrl = rawProfileUrl.split("?")[0].replace(/\/$/, ""); // Remove query params and trailing slash
      const authorName = `${post.author?.first_name || ''} ${post.author?.last_name || ''}`.trim();
      const authorUsername = post.author?.username;
      const postUrl = post.url;

      // Build clean profile URL if we have username
      const cleanProfileUrl = authorUsername
        ? `https://www.linkedin.com/in/${authorUsername}`
        : authorProfileUrl;

      if (!cleanProfileUrl || !postUrl) {
        continue;
      }

      // First, find or create the creator profile
      const { data: existingCreator } = await auth.supabase
        .from("creator_profiles")
        .select("creator_id")
        .eq("profile_url", cleanProfileUrl)
        .single();

      let creatorId: number;

      if (existingCreator) {
        creatorId = existingCreator.creator_id;
      } else {
        // Create new creator profile
        const { data: newCreator, error: createError } = await auth.supabase
          .from("creator_profiles")
          .insert({
            profile_url: cleanProfileUrl,
            display_name: authorName,
            platform: "linkedin",
          })
          .select("creator_id")
          .single();

        if (createError || !newCreator) {
          console.error("Failed to create creator:", createError);
          continue;
        }
        creatorId = newCreator.creator_id;
      }

      creatorIds.add(creatorId);

      // Check if post already exists
      const { data: existingPost } = await auth.supabase
        .from("creator_content")
        .select("content_id")
        .eq("post_url", postUrl)
        .single();

      if (!existingPost) {
        // Save the post with ALL the data as JSON
        await auth.supabase.from("creator_content").insert({
          creator_id: creatorId,
          post_url: postUrl,
          post_raw: JSON.stringify(post), // Store the FULL post object
        });
      }
    }

    // Auto-follow all creators we just processed
    for (const creatorId of creatorIds) {
      // Check if already following
      const { data: existingFollow } = await auth.supabase
        .from("user_creator_follows")
        .select("id")
        .eq("user_id", auth.user.id)
        .eq("creator_id", creatorId)
        .single();

      if (!existingFollow) {
        await auth.supabase.from("user_creator_follows").insert({
          user_id: auth.user.id,
          creator_id: creatorId,
        });
      }
    }

    return Response.json({
      success: true,
      postsScraped: allPosts.length,
      posts: allPosts.slice(0, 5) // Return first 5 posts for debugging
    }, { status: 200 });

  } catch (error) {
    console.error("LinkedIn scrape error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
