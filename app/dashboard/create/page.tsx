"use client";

import { useState } from "react";
import { ContentFeed } from "@/app/dashboard/components/ContentFeed";
import { useCreatePostViewModel } from "./createPostViewModel";
import { CreatorProfiles } from "../components/CreatorProfiles";
import { SuggestedEditsCard } from "../components/SuggestedEditsCard";
import { PostViewModal } from "../components/PostViewModal";
import { InspiredByContent } from "../components/InspiredByContent";
import type { ContentPost } from "@/types";

export default function CreatePostPage() {
  const {
    filteredContentFeed,
    creatorProfiles,
    suggestedProfiles,
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
  const suggestions = suggestedProfiles;
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
              title="Creator Profiles"
              onFollow={followCreator}
              onUnfollow={unfollowCreator}
              pendingCreatorIds={pendingCreatorIds}
            />

            <CreatorProfiles
              profiles={suggestions}
              profileCount={suggestions.length}
              title="Suggested Profiles"
              countLabel={`${suggestions.length}`}
              onFollow={followCreator}
              pendingCreatorIds={pendingCreatorIds}
              emptyState={
                <div className="rounded-xl bg-[#F6F7F6] px-3 py-4 text-xs text-[#696969]">
                  You&apos;re following everyone right now. We&apos;ll show new
                  creators here once there are suggestions.
                </div>
              }
            />
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
