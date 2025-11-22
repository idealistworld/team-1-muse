import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { useAuth } from "./useAuth";

/**
 * Generic hook for storing/retrieving user data from the user_data table
 * @param key - The unique key for this data type (e.g., 'personal_info', 'settings')
 */
export function useUserData<T = Record<string, unknown>>(key: string) {
  const { user, supabase } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load data
  useEffect(() => {
    async function loadData() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data: result } = await supabase
          .from("user_data")
          .select("data")
          .eq("user_id", user.id)
          .eq("key", key)
          .single();

        if (result?.data) {
          setData(result.data as T);
        }
      } catch (err) {
        // No data yet is fine
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [user, supabase, key]);

  // Save data
  const save = useCallback(
    async (newData: T, showToast = true) => {
      if (!user) return;

      try {
        setIsSaving(true);
        const { error } = await supabase.from("user_data").upsert(
          {
            user_id: user.id,
            key: key,
            data: newData,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,key" }
        );

        if (error) throw error;
        setData(newData);
        if (showToast) toast.success("Saved!", { autoClose: 1500 });
      } catch (err) {
        console.error("Failed to save:", err);
        toast.error("Failed to save");
      } finally {
        setIsSaving(false);
      }
    },
    [user, supabase, key]
  );

  // Clear data
  const clear = useCallback(async () => {
    if (!user) return;

    try {
      await supabase
        .from("user_data")
        .delete()
        .eq("user_id", user.id)
        .eq("key", key);

      setData(null);
      toast.success("Cleared!");
    } catch (err) {
      console.error("Failed to clear:", err);
      toast.error("Failed to clear");
    }
  }, [user, supabase, key]);

  return {
    data,
    isLoading,
    isSaving,
    save,
    clear,
    setData,
  };
}
