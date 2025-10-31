"use client";

import { PostCard } from "./PostCard";
import type { ContentPost, Profile } from "@/types";
import { Input } from "@/components/ui/input";

interface ContentFeedProps {
  posts: ContentPost[];
  postCount?: number;
  onTogglePost?: (postId: number) => void;
  onExpandPost?: (post: ContentPost) => void;
  creatorProfiles?: Profile[];
  selectedCreatorId?: number | null;
  onCreatorFilterChange?: (creatorId: number | null) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export function ContentFeed({
  posts,
  postCount = 30,
  onTogglePost,
  onExpandPost,
  creatorProfiles,
  selectedCreatorId = null,
  onCreatorFilterChange,
  searchQuery = "",
  onSearchChange,
}: ContentFeedProps) {
  const showCreatorFilter = Boolean(creatorProfiles?.length && onCreatorFilterChange);

  return (
    <section className="flex w-[378px] flex-col items-start gap-3 rounded-2xl border border-[#E1E1E1] bg-[#FFFEFE] p-4">
      <p className="text-xs font-semibold leading-none text-[#696969] uppercase tracking-wide">
        CONTENT FEED • <span className="font-normal">{postCount} posts</span>
      </p>
      {onSearchChange && (
        <div className="w-full space-y-1">
          <label className="text-xs font-semibold leading-none text-[#696969] uppercase tracking-wide">
            Search Posts
          </label>
          <Input
            value={searchQuery}
            placeholder="Search by title, author, or content..."
            onChange={(event) => onSearchChange(event.target.value)}
            className="bg-white text-[#696969]"
          />
        </div>
      )}
      {showCreatorFilter && (
        <div className="w-full space-y-1">
          <label
            htmlFor="content-feed-creator-filter"
            className="text-xs font-semibold leading-none text-[#696969] uppercase tracking-wide"
          >
            Filter by Creator
          </label>
          <select
            id="content-feed-creator-filter"
            value={selectedCreatorId === null ? "all" : selectedCreatorId.toString()}
            onChange={(event) => {
              const value = event.target.value;
              if (value === "all") {
                onCreatorFilterChange?.(null);
              } else {
                onCreatorFilterChange?.(Number(value));
              }
            }}
            className="w-full rounded-md border border-[#E1E1E1] bg-white px-3 py-2 text-sm text-[#696969] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5578C8]/40"
          >
            <option value="all">All creators</option>
            {creatorProfiles?.map((profile) => (
              <option key={profile.id} value={profile.id.toString()}>
                {profile.name}
              </option>
            ))}
          </select>
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
