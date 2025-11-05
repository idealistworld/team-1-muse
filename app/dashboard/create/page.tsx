"use client";

import { useState } from "react";
import { ContentFeed } from "@/app/dashboard/components/ContentFeed";
import { useCreatePostViewModel } from "./createPostViewModel";
import { CreatorProfiles } from "../components/CreatorProfiles";
import { ProfileCard } from "@/app/dashboard/components/ProfileCard";
import { SuggestedEditsCard } from "../components/SuggestedEditsCard";
import { PostViewModal } from "../components/PostViewModal";
import { InspiredByContent } from "../components/InspiredByContent";
import type { ContentPost, Profile } from "@/types";

export default function CreatePostPage() {
  const {
    filteredContentFeed,
    creatorProfiles,
    pendingCreatorIds,
    followCreator,
    unfollowCreator,
    togglePostHighlight,
    getHighlightedPosts,
    selectedCreatorId,
    setSelectedCreatorId,
    searchQuery,
    setSearchQuery,
  } = useCreatePostViewModel();
  const highlightedPosts = getHighlightedPosts();
  const [expandedPost, setExpandedPost] = useState<ContentPost | null>(null);

  function handleExpandPost(post: ContentPost) {
    setExpandedPost(post);
  }

  return (
    <>
      <PostViewModal
        isOpen={expandedPost !== null}
        onClose={() => setExpandedPost(null)}
        title={expandedPost?.title || ""}
        author={expandedPost?.author || ""}
        timeAgo={expandedPost?.timeAgo || ""}
        content={expandedPost?.postRaw}
        postUrl={expandedPost?.postUrl}
      />
      <div className="min-h-screen bg-[#F7F6F7] p-4">
        {/* Three Column Layout */}
        <div className="grid grid-cols-[380px_1fr_380px] gap-4 max-w-[1800px] mx-auto">
          {/* Left Column - Sidebar */}
          <div className="space-y-4">
            <ContentFeed
              posts={filteredContentFeed}
              postCount={filteredContentFeed.length}
              onTogglePost={togglePostHighlight}
              onExpandPost={handleExpandPost}
              creatorProfiles={creatorProfiles}
              selectedCreatorId={selectedCreatorId}
              onCreatorFilterChange={(value) => setSelectedCreatorId(value)}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />

            <CreatorProfiles
              profiles={creatorProfiles}
              profileCount={creatorProfiles.length}
              onFollow={followCreator}
              onUnfollow={unfollowCreator}
              pendingCreatorIds={pendingCreatorIds}
            />

            <div className="rounded-2xl border border-[#E1E1E1] bg-white p-4 space-y-3">
              <div className="text-xs font-semibold leading-none text-[#696969] uppercase tracking-wide">
                Suggested Profiles • {creatorProfiles.length} following
              </div>

              {/* If creatorProfiles has data we can map it.
                 Adjust property names if yours are different. */}
              {creatorProfiles.length > 0 ? (
                creatorProfiles.map((p: Profile & { followers?: string }) => (
                  <ProfileCard
                    key={p.id ?? p.name}
                    name={p.name}
                    connections={
                      p.followers || p.connections || "10K connections"
                    }
                  />
                ))
              ) : (
                <>
                  <ProfileCard name="Creator 1" connections="10K connections" />
                  <ProfileCard
                    name="Creator 2"
                    connections="8.2K connections"
                  />
                </>
              )}
            </div>
          </div>

          {/* Middle Column - Inspired By / Main Content */}
          <InspiredByContent highlightedPosts={highlightedPosts} />

          {/* Right Column - Suggested Edits */}
          <div>
            {highlightedPosts.length > 0 ? (
              <SuggestedEditsCard className="bg-[#FFFEFE]" />
            ) : (
              <div className="bg-[#FFFEFE] rounded-2xl border border-[#E1E1E1] p-6 text-center text-[#696969]">
                Select posts to see suggested edits
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
