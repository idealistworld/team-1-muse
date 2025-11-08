/**
 * Server-side Creator Service
 * Handles database operations for creator follow/unfollow
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { CreatorProfile } from "@/types";

interface UserFollowWithProfile {
  creator_id: number;
  created_at: string;
  creator_profiles: CreatorProfile;
}

export class CreatorService {
  /**
   * Follow a creator
   */
  async followCreator(
    supabase: SupabaseClient,
    userId: string,
    creatorId: number
  ) {
    const { data, error } = await supabase
      .from("user_follows")
      .upsert(
        {
          user_id: userId,
          creator_id: creatorId,
        },
        { onConflict: "user_id,creator_id" }
      )
      .select("user_id, creator_id, created_at")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return { data, isFollowed: true };
  }

  /**
   * Unfollow a creator
   */
  async unfollowCreator(
    supabase: SupabaseClient,
    userId: string,
    creatorId: number
  ) {
    const { error } = await supabase
      .from("user_follows")
      .delete()
      .match({ user_id: userId, creator_id: creatorId });

    if (error) {
      throw new Error(error.message);
    }

    return {
      data: { user_id: userId, creator_id: creatorId },
      isFollowed: false,
    };
  }

  /**
   * Get all creators a user is following (with creator profile data)
   */
  async getFollowedCreatorsWithProfiles(supabase: SupabaseClient, userId: string) {
    const { data, error } = await supabase
      .from("user_follows")
      .select(`
        creator_id,
        created_at,
        creator_profiles (*)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    // Extract the creator_profiles from the joined data
    return (
      data?.map((follow) => follow.creator_profiles as unknown as CreatorProfile) || []
    );
  }

  /**
   * Get all creators a user is following (just IDs)
   */
  async getFollowedCreators(supabase: SupabaseClient, userId: string) {
    const { data, error } = await supabase
      .from("user_follows")
      .select("creator_id")
      .eq("user_id", userId);

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Get all creators
   */
  async getAllCreators(supabase: SupabaseClient) {
    const { data, error } = await supabase
      .from("creator_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
}

export const creatorService = new CreatorService();
