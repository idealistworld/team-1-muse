import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ContentPost,
  CreatorContent,
  CreatorProfile,
  Profile,
} from "@/types";
import { extractNameFromUrl, formatPostTitle, formatTimeAgo } from "@/lib/formatters";

interface CreatorContentWithProfile extends CreatorContent {
  creator_profiles: {
    creator_id: number;
    profile_url: string;
    platform: string;
  };
}

interface UserFollowRow {
  creator_id: number;
  created_at: string;
}

export class ContentService {
  private supabase = createClient();

  async fetchCreatorContent(): Promise<ContentPost[]> {
    const { data } = await this.supabase
      .from("creator_content")
      .select(`
        *,
        creator_profiles!inner (
          creator_id,
          profile_url,
          platform
        )
      `)
      .order("created_at", { ascending: false });

    if (!data) return [];

    // Transform database data to ContentPost format
    return data.map((item: CreatorContentWithProfile) => ({
      id: item.content_id,
      title: formatPostTitle(item.post_raw),
      author: extractNameFromUrl(item.creator_profiles.profile_url),
      timeAgo: formatTimeAgo(item.created_at),
      isHighlighted: false,
      creatorId: item.creator_id,
      postUrl: item.post_url,
      postRaw: item.post_raw,
    }));
  }

  async fetchCreatorContentById(creatorId: number): Promise<ContentPost[]> {
    const { data } = await this.supabase
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
    await this.supabase.from("creator_content").insert({
      creator_id: creatorId,
      post_url: postUrl,
      post_raw: postRaw,
    });
  }

  /**
   * Fetch all creators and merge with user's follow status
   * If userId is provided, checks which creators the user follows and marks them
   * This enables the UI to show follow/unfollow buttons with correct state
   */
  async fetchCreators(userId?: string): Promise<Profile[]> {
    // Fetch all creator profiles from database
    const { data } = await this.supabase
      .from("creator_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!data) return [];

    // Build a map of creator IDs to follow timestamps for O(1) lookup
    const followedCreatorsMap = new Map<number, string>();

    if (userId) {
      const { data: follows, error } = await this.supabase
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

    // Transform database model to UI model, enriching with follow status and timestamp
    return data.map((creator: CreatorProfile) => ({
      id: creator.creator_id,
      name: extractNameFromUrl(creator.profile_url),
      connections: creator.platform,
      isFollowed: followedCreatorsMap.has(creator.creator_id),
      followedAt: followedCreatorsMap.get(creator.creator_id),
    }));
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
