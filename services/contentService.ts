import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ContentPost,
  CreatorContent,
  CreatorProfile,
  Profile,
  PostStats,
  PostMedia,
} from "@/types";
import { extractNameFromUrl, formatPostTitle, formatTimeAgo } from "@/lib/formatters";

interface CreatorContentWithProfile extends CreatorContent {
  creator_profiles: {
    creator_id: number;
    profile_url: string;
    platform: string;
    display_name?: string | null;
  };
}

interface UserFollowRow {
  creator_id: number;
  created_at: string;
}

interface PaginationOptions {
  limit?: number;
  offset?: number;
}

const DEFAULT_PAGE_SIZE = 1000; // Fetch all posts

export class ContentService {
  private getClient() {
    return createClient();
  }

  async fetchCreatorContent(options: PaginationOptions = {}): Promise<ContentPost[]> {
    const { limit = DEFAULT_PAGE_SIZE, offset = 0 } = options;

    const { data } = await this.getClient()
      .from("creator_content")
      .select(`
        *,
        creator_profiles!inner (
          creator_id,
          profile_url,
          platform,
          display_name
        )
      `)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (!data) return [];

    // Transform database data to ContentPost format
    const posts = data.map((item: CreatorContentWithProfile) => {
      // Try to parse post_raw as JSON (new format with full data)
      let parsedPost: Record<string, unknown> | null = null;
      try {
        if (item.post_raw?.startsWith('{')) {
          parsedPost = JSON.parse(item.post_raw);
        }
      } catch {
        // Not JSON, use as plain text
      }

      // Extract text - if JSON parsed, use text field; otherwise use raw content
      const text = parsedPost?.text as string || (parsedPost ? '' : item.post_raw) || '';
      const stats = parsedPost?.stats as ContentPost['stats'];
      const media = parsedPost?.media as ContentPost['media'];
      const article = parsedPost?.article as ContentPost['article'];
      const postedAt = parsedPost?.posted_at as { date?: string; relative?: string; timestamp?: number } | undefined;

      return {
        id: item.content_id,
        title: formatPostTitle(text),
        author: item.creator_profiles.display_name || extractNameFromUrl(item.creator_profiles.profile_url),
        timeAgo: postedAt?.relative?.split('•')[0]?.trim() || formatTimeAgo(item.created_at),
        isHighlighted: false,
        creatorId: item.creator_id,
        postUrl: item.post_url,
        postRaw: text, // Use parsed text, not raw JSON
        text,
        postedAt: postedAt?.date,
        postedAtTimestamp: postedAt?.timestamp || new Date(item.created_at).getTime(),
        postType: parsedPost?.post_type as string,
        stats,
        media,
        article,
      };
    });

    // Sort by LinkedIn post date (newest first)
    return posts.sort((a, b) => (b.postedAtTimestamp || 0) - (a.postedAtTimestamp || 0));
  }

  async fetchCreatorContentById(creatorId: number): Promise<ContentPost[]> {
    const { data } = await this.getClient()
      .from("creator_content")
      .select("*")
      .eq("creator_id", creatorId)
      .order("content_id", { ascending: false });

    if (!data) return [];

    return data.map((item: CreatorContent) => ({
      id: item.content_id,
      title: "Some Cool Post Title",
      author: "First Last",
      timeAgo: "1 day ago",
      isHighlighted: false,
      creatorId: item.creator_id,
      postUrl: item.post_url,
    }));
  }

  async saveContent(
    creatorId: number,
    postUrl: string,
    postRaw?: string
  ): Promise<void> {
    await this.getClient().from("creator_content").insert({
      creator_id: creatorId,
      post_url: postUrl,
      post_raw: postRaw,
    });
  }

  /**
   * Get total count of posts for pagination
   */
  async getPostCount(): Promise<number> {
    const { count } = await this.getClient()
      .from("creator_content")
      .select("*", { count: "exact", head: true });
    return count || 0;
  }

  /**
   * Fetch all creators and merge with user's follow status
   * If userId is provided, checks which creators the user follows and marks them
   * This enables the UI to show follow/unfollow buttons with correct state
   */
  async fetchCreators(userId?: string): Promise<Profile[]> {
    const client = this.getClient();

    // Fetch all creator profiles from database
    const { data } = await client
      .from("creator_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!data) return [];

    // Build a map of creator IDs to follow timestamps for O(1) lookup
    const followedCreatorsMap = new Map<number, string>();

    if (userId) {
      const { data: follows, error } = await client
        .from("user_follows")
        .select("creator_id, created_at")
        .eq("user_id", userId);

      if (error) {
        console.error("Failed to load followed creators", error);
      } else if (follows) {
        // Convert array of follow records to Map for efficient lookup with timestamps
        (follows as UserFollowRow[]).forEach((follow) => {
          followedCreatorsMap.set(follow.creator_id, follow.created_at);
        });
      }
    }

    // Fetch posts with stats for each creator
    const { data: contentData } = await client
      .from("creator_content")
      .select("creator_id, post_raw");

    // Calculate post counts and average stats per creator
    const creatorStats = new Map<number, { count: number; totalReactions: number; totalComments: number; totalReposts: number }>();

    if (contentData) {
      contentData.forEach((item: { creator_id: number; post_raw?: string }) => {
        const existing = creatorStats.get(item.creator_id) || { count: 0, totalReactions: 0, totalComments: 0, totalReposts: 0 };
        existing.count++;

        // Try to parse stats from post_raw JSON
        if (item.post_raw?.startsWith('{')) {
          try {
            const parsed = JSON.parse(item.post_raw);
            if (parsed.stats) {
              existing.totalReactions += parsed.stats.total_reactions || 0;
              existing.totalComments += parsed.stats.comments || 0;
              existing.totalReposts += parsed.stats.reposts || 0;
            }
          } catch {
            // Not valid JSON
          }
        }

        creatorStats.set(item.creator_id, existing);
      });
    }

    // Transform database model to UI model, enriching with follow status and stats
    return data.map((creator: CreatorProfile) => {
      const stats = creatorStats.get(creator.creator_id);
      const postCount = stats?.count || 0;

      return {
        id: creator.creator_id,
        name: creator.display_name || extractNameFromUrl(creator.profile_url),
        connections: creator.platform === "linkedin" ? "LinkedIn" : creator.platform,
        profileUrl: creator.profile_url,
        isFollowed: followedCreatorsMap.has(creator.creator_id),
        followedAt: followedCreatorsMap.get(creator.creator_id),
        postCount,
        avgReactions: postCount > 0 ? Math.round(stats!.totalReactions / postCount) : 0,
        avgComments: postCount > 0 ? Math.round(stats!.totalComments / postCount) : 0,
        avgReposts: postCount > 0 ? Math.round(stats!.totalReposts / postCount) : 0,
      };
    });
  }

  /**
   * Server-side method: Get all creator content (for API routes)
   */
  async getAllCreatorContent(supabase: SupabaseClient): Promise<CreatorContent[]> {
    const { data, error } = await supabase
      .from("creator_content")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }
}

export const contentService = new ContentService();
