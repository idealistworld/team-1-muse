/**
 * ContentFeed - Displays a filterable feed of content posts
 * Features: search by post or creator, highlight posts for inspiration
 */
"use client";

import { PostCard } from "./PostCard";
import { CardTitle } from "./CardTitle";
import type { ContentPost } from "@/types";
import { Input } from "@/components/ui/input";

interface ContentFeedProps {
  posts: ContentPost[];
  postCount?: number;
  onTogglePost?: (postId: number) => void;
  onExpandPost?: (post: ContentPost) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export function ContentFeed({
  posts,
  postCount = 30,
  onTogglePost,
  onExpandPost,
  searchQuery = "",
  onSearchChange,
}: ContentFeedProps) {

  return (
    <section className="flex w-[378px] flex-col items-start gap-3 rounded-2xl border border-[#E1E1E1] bg-white p-4">
      <CardTitle title="CONTENT FEED" subtitle={`${postCount} posts`} />
      {onSearchChange && (
        <div className="w-full">
          <Input
            value={searchQuery}
            placeholder="Search by post or creator..."
            onChange={(event) => onSearchChange(event.target.value)}
            className="bg-white text-[#696969] text-sm h-8"
          />
        </div>
      )}
      <div className="flex w-full flex-col space-y-2">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            title={post.title}
            author={post.author}
            timeAgo={post.timeAgo}
            isHighlighted={post.isHighlighted}
            onToggle={onTogglePost ? () => onTogglePost(post.id) : undefined}
            onExpand={onExpandPost ? () => onExpandPost(post) : undefined}
          />
        ))}
      </div>
    </section>
  );
}
