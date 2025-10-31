import { createClient } from "@/lib/supabase/client";
import type { ContentPost, CreatorContent, CreatorProfile, Profile } from "@/types";

interface CreatorContentWithProfile extends CreatorContent {
  creator_profiles: {
    creator_id: number;
    profile_url: string;
    platform: string;
  };
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
    return data.map((item: CreatorContentWithProfile, index: number) => {
      // Extract title from post_raw (first line or first 60 chars)
      let title = "Some Cool Post Title";
      if (item.post_raw) {
        const firstLine = item.post_raw.split('\n')[0];
        title = firstLine.length > 60
          ? firstLine.substring(0, 60) + "..."
          : firstLine;
      }

      // Calculate time ago
      const createdDate = new Date(item.created_at);
      const now = new Date();
      const diffMs = now.getTime() - createdDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const timeAgo = diffDays === 0 ? "Today" : `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

      // Extract author name from profile URL
      const authorName = this.extractNameFromUrl(item.creator_profiles.profile_url);

      return {
        id: item.content_id,
        title,
        author: authorName,
        timeAgo,
        isHighlighted: index === 0, // Highlight first post by default
        creatorId: item.creator_id,
        postUrl: item.post_url,
        postRaw: item.post_raw,
      };
    });
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

  async fetchCreators(): Promise<Profile[]> {
    const { data } = await this.supabase
      .from("creator_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!data) return [];

    // Transform CreatorProfile to Profile format for UI
    return data.map((creator: CreatorProfile) => ({
      id: creator.creator_id,
      name: this.extractNameFromUrl(creator.profile_url),
      connections: creator.platform,
    }));
  }

  private extractNameFromUrl(url: string): string {
    // Extract username/name from profile URL
    // For LinkedIn: https://www.linkedin.com/in/username -> username
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/").filter(Boolean);
      return pathParts[pathParts.length - 1] || "Unknown";
    } catch {
      return "Unknown";
    }
  }
}

export const contentService = new ContentService();
