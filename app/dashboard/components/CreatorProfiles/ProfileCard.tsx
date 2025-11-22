/**
 * ProfileCard - Renders an individual profile card
 * Used to display creator profiles in various sections of the dashboard
 */
import type { ReactNode } from "react";
import Image from "next/image";
import { Heart, MessageCircle, Repeat2 } from "lucide-react";

interface ProfileCardProps {
  name: string;
  connections: string;
  postCount?: number;
  avgReactions?: number;
  avgComments?: number;
  avgReposts?: number;
  action?: ReactNode;
}

export function ProfileCard({ name, connections, postCount, avgReactions, avgComments, avgReposts, action }: ProfileCardProps) {
  const hasStats = avgReactions !== undefined && avgReactions > 0;

  return (
    <div className="group flex items-center gap-3 w-full rounded-xl bg-white border border-gray-100 px-5 py-4 hover:border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer">
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        {/* Name */}
        <span className="text-base font-semibold text-gray-900 truncate">
          {name}
        </span>
        {/* LinkedIn logo + posts */}
        <span className="flex items-center gap-1.5 text-sm text-gray-500">
          <Image
            src="/Linkedin_icon.png"
            alt="LinkedIn"
            width={16}
            height={16}
            className="flex-shrink-0"
          />
          {postCount !== undefined ? `${postCount} posts` : connections}
        </span>
        {/* Stats */}
        {hasStats && (
          <div className="flex items-center gap-2 text-gray-400 mt-0.5">
            <div className="flex items-center gap-1" title="Avg reactions">
              <Heart className="w-3 h-3" />
              <span className="text-xs">{avgReactions?.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1" title="Avg comments">
              <MessageCircle className="w-3 h-3" />
              <span className="text-xs">{avgComments?.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1" title="Avg reposts">
              <Repeat2 className="w-3 h-3" />
              <span className="text-xs">{avgReposts?.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>
      {action ? <div className="flex-shrink-0">{action}</div> : null}
    </div>
  );
}
