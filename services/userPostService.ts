import { createClient } from "@/lib/supabase/client";
import type { PostStatus, UserPost } from "@/types";

interface CreatePostInput {
  title?: string;
  rawText?: string;
  status?: PostStatus;
}

interface UpdatePostInput {
  title?: string | null;
  rawText?: string | null;
  status?: PostStatus | null;
}

function mapRowToUserPost(row: Record<string, any>): UserPost {
  const hasColumn = (key: string) => Object.prototype.hasOwnProperty.call(row, key);

  return {
    postId: row.post_id,
    userId: row.user_id,
    title: hasColumn("title") ? row.title : undefined,
    rawText: row.raw_text ?? "",
    status: hasColumn("status") ? (row.status as PostStatus | null) ?? null : undefined,
    editorState: hasColumn("editor_state") ? row.editor_state : undefined,
    scheduledFor: hasColumn("scheduled_for") ? row.scheduled_for : undefined,
    publishedAt: hasColumn("published_at") ? row.published_at : undefined,
    wordCount: hasColumn("word_count") ? row.word_count : undefined,
    inspirationSummary: hasColumn("inspiration_summary") ? row.inspiration_summary : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

class UserPostService {
  private get client() {
    return createClient();
  }

  async fetchUserPosts(userId: string): Promise<UserPost[]> {
    const { data, error } = await this.client
      .from("user_posts")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map(mapRowToUserPost);
  }

  async createPost(userId: string, input: CreatePostInput = {}): Promise<UserPost> {
    const payload: Record<string, any> = {
      user_id: userId,
      raw_text: input.rawText ?? "",
    };

    if (typeof input.title !== "undefined") {
      payload.title = input.title;
    }

    if (typeof input.status !== "undefined") {
      payload.status = input.status;
    }

    const { data, error } = await this.client
      .from("user_posts")
      .insert(payload)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Failed to create draft");
    }

    return mapRowToUserPost(data);
  }

  async updatePost(postId: string, input: UpdatePostInput): Promise<UserPost> {
    const payload: Record<string, any> = {};

    if (typeof input.rawText !== "undefined") {
      payload.raw_text = input.rawText;
    }

    if (typeof input.title !== "undefined") {
      payload.title = input.title;
    }

    if (typeof input.status !== "undefined") {
      payload.status = input.status;
    }

    const { data, error } = await this.client
      .from("user_posts")
      .update(payload)
      .eq("post_id", postId)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Failed to update draft");
    }

    return mapRowToUserPost(data);
  }

  async deletePost(postId: string): Promise<void> {
    const { error } = await this.client
      .from("user_posts")
      .delete()
      .eq("post_id", postId);

    if (error) {
      throw new Error(error.message);
    }
  }

  async savePostTitle(postId: string, userId: string, title: string): Promise<void> {
    const { error } = await this.client.from("user_data").upsert(
      {
        user_id: userId,
        key: `post_title:${postId}`,
        data: { title },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,key" }
    );

    if (error) {
      throw new Error(error.message);
    }
  }

  async deletePostTitle(postId: string, userId: string): Promise<void> {
    await this.client
      .from("user_data")
      .delete()
      .eq("user_id", userId)
      .eq("key", `post_title:${postId}`);
  }

  async fetchPostTitles(userId: string): Promise<Record<string, string>> {
    const { data, error } = await this.client
      .from("user_data")
      .select("key, data")
      .eq("user_id", userId)
      .like("key", "post_title:%");

    if (error) {
      throw new Error(error.message);
    }

    const map: Record<string, string> = {};
    (data ?? []).forEach((row) => {
      const postId = (row.key as string)?.replace("post_title:", "");
      const title = row.data?.title;
      if (postId && typeof title === "string") {
        map[postId] = title;
      }
    });
    return map;
  }

}

export const userPostService = new UserPostService();
