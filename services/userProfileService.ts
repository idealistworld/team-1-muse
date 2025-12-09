/**
 * Service for managing user profile and personal information
 */

import { SupabaseClient } from "@supabase/supabase-js";

export type PersonalInfoData = Record<string, string>;

export interface UserProfileService {
  loadPersonalInfo(userId: string): Promise<PersonalInfoData>;
  savePersonalInfo(userId: string, data: PersonalInfoData): Promise<void>;
}

class UserProfileServiceImpl implements UserProfileService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Load personal info data for a user
   */
  async loadPersonalInfo(userId: string): Promise<PersonalInfoData> {
    const { data, error } = await this.supabase
      .from("user_data")
      .select("data")
      .eq("user_id", userId)
      .eq("key", "personal_info")
      .single();

    if (error) {
      // If no data exists yet, return empty object
      if (error.code === "PGRST116") {
        return {};
      }
      throw new Error(`Failed to load personal info: ${error.message}`);
    }

    return (data?.data as PersonalInfoData) || {};
  }

  /**
   * Save personal info data for a user
   */
  async savePersonalInfo(userId: string, data: PersonalInfoData): Promise<void> {
    const { error } = await this.supabase
      .from("user_data")
      .upsert(
        {
          user_id: userId,
          key: "personal_info",
          data: data,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,key",
        }
      );

    if (error) {
      throw new Error(`Failed to save personal info: ${error.message}`);
    }
  }
}

/**
 * Factory function to create a UserProfileService instance
 */
export function createUserProfileService(supabase: SupabaseClient): UserProfileService {
  return new UserProfileServiceImpl(supabase);
}
