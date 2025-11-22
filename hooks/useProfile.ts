import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import { useAuth } from "./useAuth";

export function useProfile() {
  const { user, supabase } = useAuth();
  const [profileData, setProfileData] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load profile data
  useEffect(() => {
    async function loadData() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_data")
          .select("data")
          .eq("user_id", user.id)
          .eq("key", "personal_info")
          .single();

        if (data?.data) {
          setProfileData(data.data);
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [user, supabase]);

  // Save profile data
  const saveProfile = useCallback(
    async (data: Record<string, string>) => {
      if (!user) return;

      try {
        setIsSaving(true);
        const { error } = await supabase.from("user_data").upsert(
          {
            user_id: user.id,
            key: "personal_info",
            data: data,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,key" }
        );

        if (error) throw error;
        toast.success("Saved!", { autoClose: 1500 });
      } catch (err) {
        console.error("Failed to save:", err);
        toast.error("Failed to save");
      } finally {
        setIsSaving(false);
      }
    },
    [user, supabase]
  );

  // Update a field (debounced save)
  const updateField = useCallback(
    (fieldId: string, value: string) => {
      setProfileData((prev) => {
        const newData = { ...prev, [fieldId]: value };

        // Debounced save
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
          saveProfile(newData);
        }, 1000);

        return newData;
      });
    },
    [saveProfile]
  );

  // Reset all data
  const resetAll = useCallback(() => {
    setProfileData({});
    saveProfile({});
    toast.success("Reset all fields");
  }, [saveProfile]);

  // Reset a category
  const resetCategory = useCallback(
    (fieldIds: string[]) => {
      setProfileData((prev) => {
        const newData = { ...prev };
        fieldIds.forEach((id) => delete newData[id]);
        saveProfile(newData);
        return newData;
      });
    },
    [saveProfile]
  );

  return {
    profileData,
    isLoading,
    isSaving,
    updateField,
    resetAll,
    resetCategory,
  };
}
