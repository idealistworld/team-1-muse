"use client";

import { useState, useMemo } from "react";
import { useCreatePostViewModel } from "../create/createPostViewModel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProfileCard } from "../components/CreatorProfiles/ProfileCard";

export default function CreatorsPage() {
  const {
    creatorProfiles,
    pendingCreatorIds,
    followCreator,
    unfollowCreator,
  } = useCreatePostViewModel();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "following" | "discover">("all");

  // Filter profiles based on search and filter type
  const filteredProfiles = useMemo(() => {
    let filtered = creatorProfiles;

    // Apply follow filter
    if (filterType === "following") {
      filtered = filtered.filter(p => p.isFollowed);
    } else if (filterType === "discover") {
      filtered = filtered.filter(p => !p.isFollowed);
    }

    // Apply search
    if (searchQuery.trim()) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Keep stable order (by ID/when added) - don't reorder on follow/unfollow
    return filtered;
  }, [creatorProfiles, searchQuery, filterType]);

  const followingCount = creatorProfiles.filter(p => p.isFollowed).length;
  const discoverCount = creatorProfiles.filter(p => !p.isFollowed).length;

  return (
    <div className="min-h-screen bg-grid" style={{ backgroundColor: '#F9FAFB' }}>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Creators</h1>
          <p className="text-gray-500">Follow creators to see their content in your feed</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 mb-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <Input
                value={searchQuery}
                placeholder="Search creators..."
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setFilterType("all")}
                variant={filterType === "all" ? "default" : "ghost"}
                size="sm"
              >
                All ({creatorProfiles.length})
              </Button>
              <Button
                onClick={() => setFilterType("following")}
                variant={filterType === "following" ? "default" : "ghost"}
                size="sm"
              >
                Following ({followingCount})
              </Button>
              <Button
                onClick={() => setFilterType("discover")}
                variant={filterType === "discover" ? "default" : "ghost"}
                size="sm"
              >
                Discover ({discoverCount})
              </Button>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            {filteredProfiles.length} {filteredProfiles.length === 1 ? 'creator' : 'creators'}
          </p>
        </div>

        {/* Profiles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProfiles.map((profile) => {
            const isFollowed = profile.isFollowed;
            const isPending = pendingCreatorIds?.has(profile.id) ?? false;

            function handleClick() {
              if (isPending) return;
              if (isFollowed) {
                unfollowCreator?.(profile.id);
              } else {
                followCreator?.(profile.id);
              }
            }

            const label = isPending ? "..." : isFollowed ? "Unfollow" : "Follow";

            return (
              <ProfileCard
                key={profile.id}
                name={profile.name}
                connections={profile.connections}
                postCount={profile.postCount}
                avgReactions={profile.avgReactions}
                avgComments={profile.avgComments}
                avgReposts={profile.avgReposts}
                action={
                  <Button
                    onClick={handleClick}
                    disabled={isPending}
                    variant={isFollowed ? "outline" : "default"}
                    size="sm"
                    aria-label={isFollowed ? "Unfollow creator" : "Follow creator"}
                    aria-pressed={isFollowed}
                  >
                    {label}
                  </Button>
                }
              />
            );
          })}
        </div>

        {filteredProfiles.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center">
            <p className="text-gray-400 text-lg">No creators found</p>
            <p className="text-gray-300 text-sm mt-2">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
