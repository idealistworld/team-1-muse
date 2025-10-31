"use client";

import { useState } from "react";
import { ContentFeed } from "@/app/dashboard/components/ContentFeed";
import { useCreatePostViewModel } from "./createPostViewModel";
import { CreatorProfiles } from "../components/CreatorProfiles";
import { SuggestedEditsCard } from "@/app/dashboard/components/SuggestedEditsCard";
import { PostViewModal } from "../components/PostViewModal";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ContentPost } from "@/types";

export default function CreatePostPage() {
  const {
    contentFeed,
    creatorProfiles,
    user,
    togglePostHighlight,
    getHighlightedPosts,
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
        {/* Auth Section */}
        <div className="flex justify-between items-center mb-6 max-w-[1800px] mx-auto">
          <h1 className="text-2xl font-bold">Muse</h1>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {user.email}
              </span>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          ) : (
            <Button onClick={() => router.push("/login")}>Login</Button>
          )}
        </div>

        {/* Three Column Layout */}
        <div className="grid grid-cols-[380px_1fr_380px] gap-4 max-w-[1800px] mx-auto">
          {/* Left Column - Sidebar */}
          <div className="space-y-4">
            <ContentFeed
              posts={contentFeed}
              postCount={contentFeed.length}
              onTogglePost={togglePostHighlight}
              onExpandPost={handleExpandPost}
            />

            <CreatorProfiles
              profiles={creatorProfiles}
              profileCount={creatorProfiles.length}
            />
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
