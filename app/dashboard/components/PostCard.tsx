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
      className={cn(
        "flex w-full items-start gap-3 rounded-xl px-3 py-3 transition-all",
        isHighlighted
          ? "border border-[#5578C8] bg-[#E9F0FF]"
          : "border border-[#E1E1E1] bg-white hover:border-[#5578C8]/30"
      )}
    >
      {/* Selection Circle/Checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle?.();
        }}
        className={cn(
          "flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center mt-1 cursor-pointer",
          isHighlighted
            ? "border-[#5578C8] bg-[#5578C8]"
            : "border-[#696969] bg-white hover:border-[#5578C8]"
        )}
        aria-label={isHighlighted ? "Remove from highlights" : "Add to highlights"}
      >
        {isHighlighted && (
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2 6L5 9L10 3"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {/* LinkedIn Icon */}
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center">
        <Image
          src="/Linkedin_icon.png"
          alt="LinkedIn"
          width={40}
          height={40}
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
          className="flex-shrink-0 p-1.5 rounded-lg hover:bg-[#E9F0FF] transition-colors text-[#696969] hover:text-[#5578C8] cursor-pointer"
          aria-label="View full post"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
