"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Loader2, Plus, UserPlus, Heart, MessageCircle, Repeat2, Flame, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { contentService } from "@/services/contentService";
import type { ContentPost, Profile } from "@/types";
import { useAuth } from "@/hooks";

const POSTS_PER_PAGE = 20;

type FilterType = "all" | "bangers" | "mid";
const CONTENT_SORT_OPTIONS = [
  { value: "recent", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "reactions", label: "Most reactions" },
  { value: "comments", label: "Most comments" },
  { value: "reposts", label: "Most reposts" },
  { value: "multiplier", label: "Top vs avg" },
] as const;

type ContentSortOption = typeof CONTENT_SORT_OPTIONS[number]["value"];

function sortContentPosts(
  posts: ContentPost[],
  sortType: ContentSortOption,
  getMultiplier: (post: ContentPost) => number
) {
  const sorted = [...posts];
  const defaultCompare = (a: ContentPost, b: ContentPost) =>
    (b.postedAtTimestamp ?? 0) - (a.postedAtTimestamp ?? 0);

  switch (sortType) {
    case "recent":
      return sorted.sort(defaultCompare);
    case "oldest":
      return sorted.sort((a, b) => (a.postedAtTimestamp ?? 0) - (b.postedAtTimestamp ?? 0));
    case "reactions":
      return sorted.sort(
        (a, b) => (b.stats?.total_reactions ?? 0) - (a.stats?.total_reactions ?? 0)
      );
    case "comments":
      return sorted.sort(
        (a, b) => (b.stats?.comments ?? 0) - (a.stats?.comments ?? 0)
      );
    case "reposts":
      return sorted.sort(
        (a, b) => (b.stats?.reposts ?? 0) - (a.stats?.reposts ?? 0)
      );
    case "multiplier":
      return sorted.sort((a, b) => {
        const diff = getMultiplier(b) - getMultiplier(a);
        return diff !== 0 ? diff : defaultCompare(a, b);
      });
    default:
      return sorted.sort(defaultCompare);
  }
}

export default function ContentPage() {
  const { user } = useAuth();
  const [allPosts, setAllPosts] = useState<ContentPost[]>([]);
  const [creators, setCreators] = useState<Profile[]>([]);
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<ContentSortOption>("recent");

  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ message: string } | null>(null);
  const [newCreatorUrl, setNewCreatorUrl] = useState("");
  const [isAddingCreator, setIsAddingCreator] = useState(false);

  // Create a map of creator avgReactions for O(1) lookup
  const creatorAvgMap = useMemo(() => {
    const map = new Map<number, number>();
    creators.forEach(c => map.set(c.id, c.avgReactions || 0));
    return map;
  }, [creators]);

  // Calculate multiplier for a post
  const getMultiplier = useCallback((post: ContentPost) => {
    const avgReactions = creatorAvgMap.get(post.creatorId) || 0;
    const postReactions = post.stats?.total_reactions || 0;
    return avgReactions > 0 ? postReactions / avgReactions : 0;
  }, [creatorAvgMap]);

  // Filter ALL posts based on performance
  const filteredPosts = useMemo(() => {
    if (filter === "all") return allPosts;
    return allPosts.filter(post => {
      const multiplier = getMultiplier(post);
      if (filter === "bangers") return multiplier >= 1.5;
      if (filter === "mid") return multiplier > 0 && multiplier < 0.7;
      return true;
    });
  }, [allPosts, filter, getMultiplier]);

  const sortedPosts = useMemo(() => {
    return sortContentPosts(filteredPosts, sortBy, getMultiplier);
  }, [filteredPosts, sortBy, getMultiplier]);

  // Infinite scroll - slice to visible count
  const visiblePosts = useMemo(() => {
    return sortedPosts.slice(0, visibleCount);
  }, [sortedPosts, visibleCount]);
  const hasMore = visibleCount < sortedPosts.length;

  // Infinite scroll with Intersection Observer
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount(prev => prev + POSTS_PER_PAGE);
      setIsLoadingMore(false);
    }, 200);
  }, [isLoadingMore, hasMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadMore]);

  // Reset visible count when filter/sort changes
  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(newFilter);
    setVisibleCount(POSTS_PER_PAGE);
  };

  const handleSortChange = (newSort: ContentSortOption) => {
    setSortBy(newSort);
    setVisibleCount(POSTS_PER_PAGE);
  };

  // Count bangers and mid posts from ALL data
  const bangerCount = useMemo(() =>
    allPosts.filter(p => getMultiplier(p) >= 1.5).length,
    [allPosts, getMultiplier]
  );
  const midCount = useMemo(() =>
    allPosts.filter(p => { const m = getMultiplier(p); return m > 0 && m < 0.7; }).length,
    [allPosts, getMultiplier]
  );

  // Load all data once
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [postsData, creatorsData] = await Promise.all([
        contentService.fetchCreatorContent({ limit: 1000 }), // Load all
        contentService.fetchCreators(user?.id),
      ]);
      setAllPosts(postsData);
      setCreators(creatorsData);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleAddCreator() {
    if (!newCreatorUrl.trim()) return;

    if (!newCreatorUrl.includes("linkedin.com/in/")) {
      setError("Please enter a valid LinkedIn profile URL (e.g., linkedin.com/in/username)");
      return;
    }

    setIsAddingCreator(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/scrape/linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileUrls: [newCreatorUrl] }),
      });

      const data = await response.json();

      if (data.success) {
        setResult({ message: `Added creator and fetched ${data.postsScraped} posts!` });
        setNewCreatorUrl("");
        loadData();
        setVisibleCount(POSTS_PER_PAGE);
      } else {
        setError(data.error || "Failed to add creator");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add creator");
    } finally {
      setIsAddingCreator(false);
    }
  }

  return (
    <div className="h-screen bg-grid flex flex-col" style={{ backgroundColor: "#F9FAFB" }}>
      {/* Sticky Header Section */}
      <div className="sticky top-0 z-10 bg-[#F9FAFB] pt-6 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Content Library</h1>
            <p className="text-gray-500">
              {creators.length} creators • {allPosts.length} posts
            </p>
          </div>

          {/* Add New Creator */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-5 h-5 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Add New Creator</h3>
          </div>
          <div className="flex gap-3">
            <Input
              type="text"
              value={newCreatorUrl}
              onChange={(e) => setNewCreatorUrl(e.target.value)}
              placeholder="Paste LinkedIn profile URL (e.g., linkedin.com/in/satyanadella)"
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && handleAddCreator()}
            />
            <Button
              onClick={handleAddCreator}
              disabled={isAddingCreator || !newCreatorUrl.trim()}
            >
              {isAddingCreator ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Add Creator
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            We&apos;ll fetch their recent posts and add them to your content library
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Success Message */}
        {result?.message && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
            {result.message}
          </div>
        )}

          {/* All Posts Header - also sticky */}
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {filter === "all" ? "All Posts" : filter === "bangers" ? "Bangers" : "Mid Posts"} ({filteredPosts.length})
            </h2>

            {/* Filter buttons & sorting */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => handleFilterChange("all")}
                  variant={filter === "all" ? "default" : "ghost"}
                  size="sm"
                >
                  All ({allPosts.length})
                </Button>
                <Button
                  onClick={() => handleFilterChange("bangers")}
                  variant={filter === "bangers" ? "default" : "ghost"}
                  size="sm"
                  className={filter === "bangers" ? "bg-orange-500 hover:bg-orange-600" : ""}
                >
                  <Flame className="w-3.5 h-3.5" />
                  Bangers ({bangerCount})
                </Button>
                <Button
                  onClick={() => handleFilterChange("mid")}
                  variant={filter === "mid" ? "default" : "ghost"}
                  size="sm"
                >
                  <TrendingDown className="w-3.5 h-3.5" />
                  Mid ({midCount})
                </Button>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <label htmlFor="content-sort" className="whitespace-nowrap">Sort by</label>
                <select
                  id="content-sort"
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value as ContentSortOption)}
                  className="min-w-[170px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200"
                >
                  {CONTENT_SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Posts Section */}
      <div className="flex-1 overflow-y-auto px-6 pb-16">
        <div className="max-w-4xl mx-auto">
          {isLoading ? (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
              <p className="text-gray-400 mt-2">Loading posts...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {visiblePosts.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
                  <p className="text-gray-400">
                    {filter === "all" ? "No posts yet. Add a creator and fetch their posts!" : `No ${filter} posts found`}
                  </p>
                </div>
              ) : (
                visiblePosts.map((post) => {
                  const creator = creators.find(c => c.id === post.creatorId);

                  // Calculate performance vs average
                  const avgReactions = creator?.avgReactions || 0;
                  const postReactions = post.stats?.total_reactions || 0;
                  const multiplier = avgReactions > 0 ? postReactions / avgReactions : 0;
                  const isBanger = multiplier >= 1.5;
                  const isMid = multiplier > 0 && multiplier < 0.7;

                  return (
                    <div key={post.id} className={`bg-white rounded-xl border p-4 ${isBanger ? 'border-orange-200 bg-orange-50/30' : 'border-gray-100'}`}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-medium text-gray-900">{creator?.name || "Unknown"}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-400">{post.timeAgo}</span>
                        {post.postType && post.postType !== 'regular' && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{post.postType}</span>
                        )}
                        {isBanger && (
                          <span className="flex items-center gap-1 text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                            <Flame className="w-3 h-3" />
                            {multiplier.toFixed(1)}x avg
                          </span>
                        )}
                        {isMid && (
                          <span className="flex items-center gap-1 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                            <TrendingDown className="w-3 h-3" />
                            {multiplier.toFixed(1)}x avg
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-4">{post.text || post.postRaw || post.title}</p>

                      {post.stats && (
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50">
                          <div className={`flex items-center gap-1 ${isBanger ? 'text-orange-500' : 'text-gray-400'}`}>
                            <Heart className="w-4 h-4" />
                            <span className="text-xs">{post.stats.total_reactions?.toLocaleString() || 0}</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-400">
                            <MessageCircle className="w-4 h-4" />
                            <span className="text-xs">{post.stats.comments?.toLocaleString() || 0}</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-400">
                            <Repeat2 className="w-4 h-4" />
                            <span className="text-xs">{post.stats.reposts?.toLocaleString() || 0}</span>
                          </div>
                          {post.postUrl && (
                            <a
                              href={post.postUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-500 hover:underline ml-auto"
                            >
                              View on LinkedIn →
                            </a>
                          )}
                        </div>
                      )}

                      {!post.stats && post.postUrl && (
                        <a
                          href={post.postUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline mt-2 inline-block"
                        >
                          View on LinkedIn →
                        </a>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Infinite scroll trigger */}
          {hasMore && (
            <div ref={loadMoreRef} className="flex justify-center py-8">
              {isLoadingMore ? (
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              ) : (
                <span className="text-sm text-gray-400">Scroll for more...</span>
              )}
            </div>
          )}

          {/* End of list indicator */}
          {!hasMore && visiblePosts.length > 0 && (
            <div className="text-center py-6 text-sm text-gray-400">
              Showing all {filteredPosts.length} posts
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
