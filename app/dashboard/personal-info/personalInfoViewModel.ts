/**
 * ViewModel for Personal Info Page
 * Handles business logic and state management for user profile data
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createUserProfileService, PersonalInfoData } from "@/services/userProfileService";
import { useAuth } from "@/hooks";

export interface PersonalInfoViewModel {
  // State
  formData: PersonalInfoData;
  isLoading: boolean;
  isSaving: boolean;

  // Actions
  setFormData: (data: PersonalInfoData) => void;
  updateField: (fieldId: string, value: string) => void;

  // Status
  hasUnsavedChanges: boolean;
}

export function usePersonalInfoViewModel(): PersonalInfoViewModel {
  const { user, supabase } = useAuth();
  const [formData, setFormData] = useState<PersonalInfoData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const userProfileService = useMemo(() => createUserProfileService(supabase), [supabase]);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<string>("");
  const hasInitiallyLoadedRef = useRef(false);

  // Load personal info on mount
  useEffect(() => {
    async function loadData() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await userProfileService.loadPersonalInfo(user.id);
        setFormData(data);
        lastSavedDataRef.current = JSON.stringify(data);
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error("Failed to load personal info:", error);
        throw error;
      } finally {
        setIsLoading(false);
        // Mark as initially loaded after a short delay to prevent immediate save
        setTimeout(() => {
          hasInitiallyLoadedRef.current = true;
        }, 100);
      }
    }

    loadData();
  }, [user, userProfileService]);

  // Auto-save with debouncing
  useEffect(() => {
    // Don't save during initial load or before data has loaded
    if (isLoading || !hasInitiallyLoadedRef.current || !user) return;

    // Don't save if data hasn't actually changed
    const currentDataStr = JSON.stringify(formData);
    if (currentDataStr === lastSavedDataRef.current) {
      setHasUnsavedChanges(false);
      return;
    }

    setHasUnsavedChanges(true);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      // Double-check data has changed before saving
      const dataStr = JSON.stringify(formData);
      if (dataStr !== lastSavedDataRef.current) {
        try {
          setIsSaving(true);
          await userProfileService.savePersonalInfo(user.id, formData);
          lastSavedDataRef.current = dataStr;
          setHasUnsavedChanges(false);
        } catch (error) {
          console.error("Failed to save personal info:", error);
          throw error;
        } finally {
          setIsSaving(false);
        }
      }
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [formData, isLoading, user, userProfileService]);

  const updateField = useCallback((fieldId: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  }, []);

  return {
    formData,
    isLoading,
    isSaving,
    hasUnsavedChanges,
    setFormData,
    updateField,
  };
}
