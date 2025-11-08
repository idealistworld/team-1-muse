import Image from "next/image";
import { cn } from "@/lib/utils";
import { Maximize2 } from "lucide-react";

interface PostCardProps {
  title: string;
  author: string;
  timeAgo: string;
  isHighlighted?: boolean;
  onToggle?: () => void;
  onExpand?: () => void;
}

export function PostCard({
  title,
  author,
  timeAgo,
  isHighlighted = false,
  onToggle,
  onExpand
}: PostCardProps) {
  return (
    <div
      onClick={onToggle}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-3 transition-all cursor-pointer",
        isHighlighted
          ? "border-2 border-[#5578C8] bg-[#E9F0FF]"
          : "border border-[#E1E1E1] bg-white hover:bg-[#F9FAFB]"
      )}
    >
      {/* LinkedIn Icon */}
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center">
        <Image
          src="/Linkedin_icon.png"
          alt="LinkedIn"
          width={32}
          height={32}
        />
      </div>

      {/* Post Content */}
      <div className="flex flex-col flex-1 min-w-0">
        <span className="text-sm font-semibold leading-tight text-[#696969] truncate">
          {title}
        </span>
        <span className="text-xs font-normal text-[#696969]">
          {author} • {timeAgo}
        </span>
      </div>

      {/* Expand Button */}
      {onExpand && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onExpand();
          }}
          className="flex-shrink-0 p-1.5 rounded-lg hover:bg-[#E9F0FF] transition-colors text-[#696969] hover:text-muse cursor-pointer"
          aria-label="View full post"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
