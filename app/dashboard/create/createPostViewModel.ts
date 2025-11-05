import { useState, useEffect, useMemo, useCallback } from "react";
import type { ContentPost, Profile } from "@/types";
import { contentService } from "@/services/contentService";
import { toast } from "react-toastify";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export function useCreatePostViewModel() {
  const [contentFeed, setContentFeed] = useState<ContentPost[]>([]);
  const [creatorProfiles, setCreatorProfiles] = useState<Profile[]>([]);
  const [suggestedProfiles, setSuggestedProfiles] = useState<Profile[]>([]);
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

  // Fetch creator content for the feed
  useEffect(() => {
    let isMounted = true;

    async function fetchContent() {
      try {
        const posts = await contentService.fetchCreatorContent();
        if (!isMounted) return;
        setContentFeed(posts);
      } catch (error) {
        if (!isMounted) return;
        toast.error("Failed to load content. Please try again.");
        console.error("Error fetching content feed:", error);
      }
    }

    fetchContent();

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshFollowedCreators = useCallback(
    async (options: { silent?: boolean } = {}) => {
      if (!user?.id) {
        setCreatorProfiles([]);
        setPendingCreatorIds(new Set<number>());
        return true;
      }

      try {
        const creators = await contentService.fetchCreators(user.id);
        setCreatorProfiles(creators);
        setPendingCreatorIds(new Set<number>());
        return true;
      } catch (error) {
        if (!options.silent) {
          toast.error("Failed to load followed creators. Please try again.");
        }
        console.error("Error fetching followed creators:", error);
        return false;
      }
    },
    [user?.id]
  );

  useEffect(() => {
    refreshFollowedCreators();
  }, [refreshFollowedCreators]);

  const refreshSuggestedProfiles = useCallback(
    async (currentUserId?: string | null) => {
      try {
        const profiles = await contentService.fetchSuggestedCreators(
          currentUserId
        );
        setSuggestedProfiles(profiles);
      } catch (error) {
        setSuggestedProfiles([]);
        toast.error("Failed to load suggested creators. Please try again.");
        console.error("Error fetching suggested creators:", error);
      }
    },
    []
  );

  useEffect(() => {
    refreshSuggestedProfiles(user?.id);
  }, [user?.id, refreshSuggestedProfiles]);

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

    if (creatorProfiles.some((profile) => profile.id === creatorId)) {
      toast.info("You're already following this creator.");
      return;
    }

    const accessToken = await getAccessToken();
    if (!accessToken) {
      toast.error("Session expired. Please sign in again.");
      return;
    }

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
      if (user?.id) {
        setSuggestedProfiles((prev) =>
          prev.filter((profile) => profile.id !== creatorId)
        );
        const refreshed = await refreshFollowedCreators({ silent: true });
        await refreshSuggestedProfiles(user.id);
        if (!refreshed) {
          toast.warn("Creator list may be out of date. Please refresh.");
        }
      }
    } catch (error) {
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

    if (!creatorProfiles.some((profile) => profile.id === creatorId)) {
      return;
    }

    const accessToken = await getAccessToken();
    if (!accessToken) {
      toast.error("Session expired. Please sign in again.");
      return;
    }

    const previousProfiles = creatorProfiles;

    setCreatorProfiles((prevProfiles) =>
      prevProfiles.filter((profile) => profile.id !== creatorId)
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
      if (user?.id) {
        const refreshed = await refreshFollowedCreators({ silent: true });
        await refreshSuggestedProfiles(user.id);
        if (!refreshed) {
          toast.warn("Creator list may be out of date. Please refresh.");
        }
      }
    } catch (error) {
      setCreatorProfiles(previousProfiles);

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
    suggestedProfiles,
  };
}
