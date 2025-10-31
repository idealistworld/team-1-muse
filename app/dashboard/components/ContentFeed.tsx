"use client";

import { PostCard } from "./PostCard";
import type { ContentPost, Profile } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
          <label className="text-xs font-semibold leading-none text-[#696969] uppercase tracking-wide">
            Filter by Creator
          </label>
          <Select
            value={selectedCreatorId === null ? "all" : selectedCreatorId.toString()}
            onValueChange={(value) => {
              if (value === "all") {
                onCreatorFilterChange?.(null);
              } else {
                onCreatorFilterChange?.(Number(value));
              }
            }}
          >
            <SelectTrigger className="bg-white text-[#696969]">
              <SelectValue placeholder="All creators" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All creators</SelectItem>
              {creatorProfiles?.map((profile) => (
                <SelectItem key={profile.id} value={profile.id.toString()}>
                  {profile.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
