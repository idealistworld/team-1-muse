/**
 * Service for scraping LinkedIn profiles using Apify
 */

import { SupabaseClient } from "@supabase/supabase-js";

const APIFY_ACTOR_ID = "apimaestro~linkedin-profile-posts";

export interface ApiMaestroPost {
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

export interface ScrapeResult {
  success: boolean;
  postsScraped: number;
  posts?: ApiMaestroPost[];
  error?: string;
  urlsSent?: string[];
}

export interface LinkedInScraperService {
  scrapeProfiles(profileUrls: string[], userId: string): Promise<ScrapeResult>;
}

class LinkedInScraperServiceImpl implements LinkedInScraperService {
  constructor(
    private supabase: SupabaseClient,
    private apifyToken: string
  ) {}

  /**
   * Scrape LinkedIn profiles and save posts to database
   */
  async scrapeProfiles(profileUrls: string[], userId: string): Promise<ScrapeResult> {
    if (!profileUrls || profileUrls.length === 0) {
      throw new Error("Profile URLs are required");
    }

    // Fetch posts from Apify
    const allPosts = await this.fetchPostsFromApify(profileUrls);

    if (allPosts.length === 0) {
      return {
        success: false,
        postsScraped: 0,
        error: "No posts found for any profile",
        urlsSent: profileUrls,
      };
    }

    // Save posts and auto-follow creators
    await this.savePostsAndAutoFollow(allPosts, userId);

    return {
      success: true,
      postsScraped: allPosts.length,
      posts: allPosts.slice(0, 5), // Return first 5 for debugging
    };
  }

  /**
   * Fetch posts from Apify API for given profile URLs
   */
  private async fetchPostsFromApify(profileUrls: string[]): Promise<ApiMaestroPost[]> {
    const allPosts: ApiMaestroPost[] = [];

    for (const profileUrl of profileUrls) {
      // Extract username from URL (e.g., linkedin.com/in/satyanadella -> satyanadella)
      const urlMatch = profileUrl.match(/linkedin\.com\/in\/([^\/\?]+)/);
      const username = urlMatch ? urlMatch[1] : profileUrl;

      const inputBody = {
        username: username,
      };

      const runResponse = await fetch(
        `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/run-sync-get-dataset-items?token=${this.apifyToken}`,
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
        const posts = this.extractPostsFromResponse(results);
        allPosts.push(...posts);
      } catch {
        console.error(`Invalid JSON response for ${username}`);
      }
    }

    return allPosts;
  }

  /**
   * Extract posts from Apify response (handles multiple response formats)
   */
  private extractPostsFromResponse(results: any): ApiMaestroPost[] {
    // Handle wrapped response format: [{ success, data: { posts } }]
    if (results[0]?.success && results[0]?.data?.posts) {
      return results[0].data.posts;
    }
    // Handle direct posts format: [{ urn, text, ... }, ...]
    else if (results[0]?.urn || results[0]?.text) {
      return results;
    }
    // Handle single response object (not array): { success, data: { posts } }
    else if (results?.success && results?.data?.posts) {
      return results.data.posts;
    }
    // Unexpected format
    else {
      console.error("Unexpected Apify response format");
      return [];
    }
  }

  /**
   * Save posts to database and auto-follow creators
   */
  private async savePostsAndAutoFollow(posts: ApiMaestroPost[], userId: string): Promise<void> {
    const creatorIds = new Set<number>();

    for (const post of posts) {
      const creatorId = await this.findOrCreateCreator(post);
      if (!creatorId) continue;

      creatorIds.add(creatorId);

      // Save post if it doesn't exist
      await this.savePostIfNew(post, creatorId);
    }

    // Auto-follow all creators
    await this.autoFollowCreators(Array.from(creatorIds), userId);
  }

  /**
   * Find existing creator or create new one
   */
  private async findOrCreateCreator(post: ApiMaestroPost): Promise<number | null> {
    const rawProfileUrl = post.author?.profile_url || "";
    const authorProfileUrl = rawProfileUrl.split("?")[0].replace(/\/$/, "");
    const authorName = `${post.author?.first_name || ""} ${post.author?.last_name || ""}`.trim();
    const authorUsername = post.author?.username;

    const cleanProfileUrl = authorUsername
      ? `https://www.linkedin.com/in/${authorUsername}`
      : authorProfileUrl;

    if (!cleanProfileUrl) {
      return null;
    }

    // Try to find existing creator
    const { data: existingCreator } = await this.supabase
      .from("creator_profiles")
      .select("creator_id")
      .eq("profile_url", cleanProfileUrl)
      .single();

    if (existingCreator) {
      return existingCreator.creator_id;
    }

    // Create new creator
    const { data: newCreator, error: createError } = await this.supabase
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
      return null;
    }

    return newCreator.creator_id;
  }

  /**
   * Save post to database if it doesn't already exist
   */
  private async savePostIfNew(post: ApiMaestroPost, creatorId: number): Promise<void> {
    const postUrl = post.url;
    if (!postUrl) return;

    // Check if post already exists
    const { data: existingPost } = await this.supabase
      .from("creator_content")
      .select("content_id")
      .eq("post_url", postUrl)
      .single();

    if (!existingPost) {
      await this.supabase.from("creator_content").insert({
        creator_id: creatorId,
        post_url: postUrl,
        post_raw: JSON.stringify(post),
      });
    }
  }

  /**
   * Auto-follow creators for a user
   */
  private async autoFollowCreators(creatorIds: number[], userId: string): Promise<void> {
    for (const creatorId of creatorIds) {
      // Check if already following
      const { data: existingFollow } = await this.supabase
        .from("user_creator_follows")
        .select("id")
        .eq("user_id", userId)
        .eq("creator_id", creatorId)
        .single();

      if (!existingFollow) {
        await this.supabase.from("user_creator_follows").insert({
          user_id: userId,
          creator_id: creatorId,
        });
      }
    }
  }
}

/**
 * Factory function to create LinkedInScraperService
 */
export function createLinkedInScraperService(
  supabase: SupabaseClient,
  apifyToken: string
): LinkedInScraperService {
  return new LinkedInScraperServiceImpl(supabase, apifyToken);
}
