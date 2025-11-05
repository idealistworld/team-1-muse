import { useState, useEffect, useMemo } from "react";
import type { ContentPost, Profile } from "@/types";
import { contentService } from "@/services/contentService";
import { toast } from "react-toastify";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export function useCreatePostViewModel() {
  const [contentFeed, setContentFeed] = useState<ContentPost[]>([]);
  const [creatorProfiles, setCreatorProfiles] = useState<Profile[]>([]);
  const [pendingCreatorIds, setPendingCreatorIds] = useState<Set<number>>(
    new Set<number>()
  );
  const [user, setUser] = useState<User | null>(null);
  const [selectedCreatorId, setSelectedCreatorId] = useState<number | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const supabase = useMemo(() => createClient(), []);

  function setPending(creatorId: number, pending: boolean) {
    setPendingCreatorIds((prev) => {
      const next = new Set(prev);
      if (pending) {
        next.add(creatorId);
      } else {
        next.delete(creatorId);
      }
      return next;
    });
  }

  async function getAccessToken(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }

  // Fetch user session
  useEffect(() => {
    let isMounted = true;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!isMounted) return;
      setUser(user);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!isMounted) return;
        setUser(session?.user ?? null);
      }
    );

    return () => {
      isMounted = false;
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
          contentService.fetchCreators(user?.id ?? undefined),
        ]);
        if (isMounted) {
          setContentFeed(posts);
          setCreatorProfiles(creators);
          setPendingCreatorIds(new Set<number>());
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
  }, [user?.id]);

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

  // Filter posts by selected creator
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredContentFeed = contentFeed.filter((post) => {
    const matchesCreator =
      selectedCreatorId === null || post.creatorId === selectedCreatorId;

    if (!matchesCreator) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystacks = [post.title, post.author, post.postRaw ?? ""];
    return haystacks.some((value) =>
      value.toLowerCase().includes(normalizedQuery)
    );
  });

  function clearCreatorFilter() {
    setSelectedCreatorId(null);
  }

  function clearSearchQuery() {
    setSearchQuery("");
  }

  // Clear all highlights
  function clearAllHighlights() {
    const highlightCount = contentFeed.filter((post) => post.isHighlighted).length;
    if (highlightCount > 0) {
      setContentFeed((prevFeed) =>
        prevFeed.map((post) => ({ ...post, isHighlighted: false }))
      );
      toast.success(
        `Cleared ${highlightCount} highlighted post${
          highlightCount > 1 ? "s" : ""
        }`
      );
    } else {
      toast.info("No highlights to clear");
    }
  }

  async function followCreator(creatorId: number) {
    if (!user) {
      toast.error("Please sign in to follow creators.");
      return;
    }

    if (pendingCreatorIds.has(creatorId)) {
      return;
    }

    const targetProfile = creatorProfiles.find(
      (profile) => profile.id === creatorId
    );

    if (!targetProfile || targetProfile.isFollowed) {
      return;
    }

    const accessToken = await getAccessToken();
    if (!accessToken) {
      toast.error("Session expired. Please sign in again.");
      return;
    }

    const previousState = targetProfile.isFollowed;

    setCreatorProfiles((prevProfiles) =>
      prevProfiles.map((profile) =>
        profile.id === creatorId ? { ...profile, isFollowed: true } : profile
      )
    );

    setPending(creatorId, true);

    try {
      const response = await fetch("/api/creators/follow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ creatorId }),
      });

      const payload: { error?: string } = await response
        .json()
        .catch(() => ({}));

      if (!response.ok || payload.error) {
        throw new Error(payload.error ?? "Failed to follow creator.");
      }

      toast.success("Creator followed.");
    } catch (error) {
      setCreatorProfiles((prevProfiles) =>
        prevProfiles.map((profile) =>
          profile.id === creatorId
            ? { ...profile, isFollowed: previousState }
            : profile
        )
      );

      const message =
        error instanceof Error ? error.message : "Failed to follow creator.";
      toast.error(message);
    } finally {
      setPending(creatorId, false);
    }
  }

  async function unfollowCreator(creatorId: number) {
    if (!user) {
      toast.error("Please sign in to unfollow creators.");
      return;
    }

    if (pendingCreatorIds.has(creatorId)) {
      return;
    }

    const targetProfile = creatorProfiles.find(
      (profile) => profile.id === creatorId
    );

    if (!targetProfile || !targetProfile.isFollowed) {
      return;
    }

    const accessToken = await getAccessToken();
    if (!accessToken) {
      toast.error("Session expired. Please sign in again.");
      return;
    }

    const previousState = targetProfile.isFollowed;

    setCreatorProfiles((prevProfiles) =>
      prevProfiles.map((profile) =>
        profile.id === creatorId ? { ...profile, isFollowed: false } : profile
      )
    );

    setPending(creatorId, true);

    try {
      const response = await fetch("/api/creators/unfollow", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ creatorId }),
      });

      const payload: { error?: string } = await response
        .json()
        .catch(() => ({}));

      if (!response.ok || payload.error) {
        throw new Error(payload.error ?? "Failed to unfollow creator.");
      }

      toast.success("Creator unfollowed.");
    } catch (error) {
      setCreatorProfiles((prevProfiles) =>
        prevProfiles.map((profile) =>
          profile.id === creatorId
            ? { ...profile, isFollowed: previousState }
            : profile
        )
      );

      const message =
        error instanceof Error
          ? error.message
          : "Failed to unfollow creator.";
      toast.error(message);
    } finally {
      setPending(creatorId, false);
    }
  }

  return {
    contentFeed,
    filteredContentFeed,
    creatorProfiles,
    pendingCreatorIds,
    user,
    togglePostHighlight,
    getHighlightedPosts,
    clearAllHighlights,
    selectedCreatorId,
    setSelectedCreatorId,
    clearCreatorFilter,
    searchQuery,
    setSearchQuery,
    clearSearchQuery,
    followCreator,
    unfollowCreator,
  };
}
