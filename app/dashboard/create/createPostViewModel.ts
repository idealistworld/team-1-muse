import { useState, useEffect } from "react";
import type { ContentPost, Profile } from "@/types";
import { contentService } from "@/services/contentService";
import { toast } from "react-toastify";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export function useCreatePostViewModel() {
  const [contentFeed, setContentFeed] = useState<ContentPost[]>([]);
  const [creatorProfiles, setCreatorProfiles] = useState<Profile[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  // Fetch user session
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  // Fetch creator content and profiles from service
  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        const [posts, creators] = await Promise.all([
          contentService.fetchCreatorContent(),
          contentService.fetchCreators(),
        ]);
        if (isMounted) {
          setContentFeed(posts);
          setCreatorProfiles(creators);
        }
      } catch (error) {
        if (isMounted) {
          toast.error("Failed to load content. Please try again.");
          console.error("Error fetching data:", error);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Toggle post highlight state
  function togglePostHighlight(postId: number) {
    // Get current state before updating
    const post = contentFeed.find((p) => p.id === postId);
    const newState = !post?.isHighlighted;

    setContentFeed((prevFeed) =>
      prevFeed.map((post) =>
        post.id === postId
          ? { ...post, isHighlighted: !post.isHighlighted }
          : post
      )
    );

    // Show toast after state update
    toast.info(
      newState ? "Post added to highlights" : "Post removed from highlights"
    );
  }

  // Get all highlighted posts
  function getHighlightedPosts() {
    return contentFeed.filter((post) => post.isHighlighted);
  }

  // Clear all highlights
  function clearAllHighlights() {
    const highlightCount = contentFeed.filter((post) => post.isHighlighted).length;
    if (highlightCount > 0) {
      setContentFeed((prevFeed) =>
        prevFeed.map((post) => ({ ...post, isHighlighted: false }))
      );
      toast.success(`Cleared ${highlightCount} highlighted post${highlightCount > 1 ? 's' : ''}`);
    } else {
      toast.info("No highlights to clear");
    }
  }

  return {
    contentFeed,
    creatorProfiles,
    user,
    togglePostHighlight,
    getHighlightedPosts,
    clearAllHighlights,
  };
}
