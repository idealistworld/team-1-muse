"use client";

import { useState } from "react";
import { ContentFeed } from "@/app/dashboard/components/ContentFeed";
import { useCreatePostViewModel } from "./createPostViewModel";
import { CreatorProfiles } from "../components/CreatorProfiles";
import { ProfileCard } from "@/app/dashboard/components/ProfileCard";
import { SuggestedEditsCard } from "../components/SuggestedEditsCard";
import { PostViewModal } from "../components/PostViewModal";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ContentPost } from "@/types";

export default function CreatePostPage() {
  const {
    filteredContentFeed,
    creatorProfiles,
    user,
    togglePostHighlight,
    getHighlightedPosts,
    selectedCreatorId,
    setSelectedCreatorId,
    searchQuery,
    setSearchQuery,
  } = useCreatePostViewModel();
  const router = useRouter();
  const supabase = createClient();

  const highlightedPosts = getHighlightedPosts();
  const [expandedPost, setExpandedPost] = useState<ContentPost | null>(null);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

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
            />
  
          <div className="rounded-2xl border border-[#E1E1E1] bg-white p-4 space-y-3">
              <div className="text-xs font-semibold leading-none text-[#696969] uppercase tracking-wide">
                Suggested Profiles • {creatorProfiles.length} following
              </div>

              {/* If creatorProfiles has data we can map it.
                 Adjust property names if yours are different. */}
              {creatorProfiles.length > 0 ? (
                creatorProfiles.map((p: any) => (
                  <ProfileCard
                    key={p.id ?? p.name}
                    name={p.name}
                    connections={p.followers || p.connections || "10K connections"}
                  />
                ))
              ) : (
                <>
                  <ProfileCard
                    name="Creator 1"
                    connections="10K connections"
                  />
                  <ProfileCard
                    name="Creator 2"
                    connections="8.2K connections"
                  />
                </>
              )}
            </div>
          </div>

          {/* Middle Column - Inspired By / Main Content */}
          <div className="bg-[#FFFEFE] rounded-2xl border border-[#E1E1E1] p-4 min-h-[600px]">
            <div className="mb-4">
              <p className="text-xs font-semibold leading-none text-[#696969] uppercase tracking-wide">
                INSPIRED BY •{" "}
                {highlightedPosts.length > 0 ? (
                  <span className="font-normal">
                    {highlightedPosts.map((p) => p.title).join(" • ")}
                  </span>
                ) : (
                  <span className="font-normal">
                    Select posts to inspire your content
                  </span>
                )}
              </p>
            </div>

            {highlightedPosts.length > 0 ? (
              <div className="space-y-6">
                {highlightedPosts.map((post) => (
                  <div
                    key={post.id}
                    className="pb-6 border-b border-[#E1E1E1] last:border-b-0"
                  >
                    <p className="text-[#696969] whitespace-pre-wrap leading-relaxed">
                      {post.postRaw || "No content available"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-96 text-[#696969]">
                Select posts from the feed to see inspiration
              </div>
            )}
          </div>

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
