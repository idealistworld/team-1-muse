"use client";

import { CardTitle } from "@/app/dashboard/components/shared/CardTitle";
import type { ContentPost } from "@/types";

interface InspirationPostsCardProps {
  posts: ContentPost[];
}

export function InspirationPostsCard({ posts }: InspirationPostsCardProps) {
  if (posts.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-[#E1E1E1] p-4">
      <div className="space-y-6">
        {posts.map((post) => {
          const postContent = post.postRaw || "";
          const wordCount = postContent.split(/\s+/).filter(Boolean).length;
          const charCount = postContent.length;

          return (
            <div
              key={post.id}
              className="pb-6 border-b border-[#E1E1E1] last:border-b-0 last:pb-0"
            >
              <div className="mb-3">
                <CardTitle
                  title="ORIGINAL POST"
                  subtitle={`${wordCount} words • ${charCount} characters`}
                />
              </div>
              <div className="mb-2">
                <p className="text-xs font-semibold text-[#696969]">{post.title}</p>
              </div>
              <p className="text-[#696969] whitespace-pre-wrap leading-relaxed text-sm">
                {postContent || "No content available"}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
