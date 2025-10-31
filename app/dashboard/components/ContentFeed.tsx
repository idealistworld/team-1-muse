import { PostCard } from "./PostCard";
import type { ContentPost } from "@/types";

interface ContentFeedProps {
  posts: ContentPost[];
  postCount?: number;
  onTogglePost?: (postId: number) => void;
  onExpandPost?: (post: ContentPost) => void;
}

export function ContentFeed({
  posts,
  postCount = 30,
  onTogglePost,
  onExpandPost,
}: ContentFeedProps) {
  return (
    <section className="flex w-[378px] flex-col items-start gap-3 rounded-2xl border border-[#E1E1E1] bg-[#FFFEFE] p-4">
      <p className="text-xs font-semibold leading-none text-[#696969] uppercase tracking-wide">
        CONTENT FEED • <span className="font-normal">{postCount} posts</span>
      </p>
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
