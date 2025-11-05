/**
 * CreatorProfiles - Displays a list of creator profiles with optional follow controls.
 * Can be reused for followed creators or suggested creators by configuring props.
 */
import type { ReactNode } from "react";
import { ProfileCard } from "./ProfileCard";
import type { Profile } from "@/types";
import { Loader2, Minus, Plus } from "lucide-react";

interface CreatorProfilesProps {
  profiles: Profile[];
  profileCount?: number;
  title?: string;
  countLabel?: string;
  emptyState?: ReactNode;
  onFollow?: (creatorId: number) => void;
  onUnfollow?: (creatorId: number) => void;
  pendingCreatorIds?: Set<number>;
}

export function CreatorProfiles({
  profiles,
  profileCount,
  title = "Creator Profiles",
  countLabel,
  emptyState,
  onFollow,
  onUnfollow,
  pendingCreatorIds,
}: CreatorProfilesProps) {
  const totalProfiles = profileCount ?? profiles.length;
  const displayCount =
    countLabel ??
    `${totalProfiles} profile${totalProfiles === 1 ? "" : "s"}`;

  return (
    <section className="flex w-[378px] flex-col items-start gap-3 rounded-2xl border border-[#E1E1E1] bg-[#FFFEFE] p-4">
      <p className="text-xs font-semibold leading-none text-[#696969] uppercase tracking-wide">
        {title.toUpperCase()} •{" "}
        <span className="font-normal">{displayCount}</span>
      </p>
      <div className="flex w-full flex-col space-y-2">
        {profiles.length > 0
          ? profiles.map((profile) => {
              const isFollowed = profile.isFollowed;
              const isPending = pendingCreatorIds?.has(profile.id) ?? false;

              function handleClick() {
                if (isPending) return;
                if (isFollowed) {
                  onUnfollow?.(profile.id);
                } else {
                  onFollow?.(profile.id);
                }
              }

              const Icon = isPending ? Loader2 : isFollowed ? Minus : Plus;
              const label = isFollowed ? "Following" : "Follow";

              return (
                <ProfileCard
                  key={profile.id}
                  name={profile.name}
                  connections={profile.connections}
                  action={
                    onFollow || onUnfollow ? (
                      <button
                        type="button"
                        onClick={handleClick}
                        disabled={isPending}
                        aria-label={
                          isFollowed ? "Unfollow creator" : "Follow creator"
                        }
                        aria-pressed={isFollowed}
                        className={`group relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all
                      ${
                        isFollowed
                          ? "border border-[#696969] bg-white/80 text-[#555555] hover:bg-[#696969]/10"
                          : "bg-gradient-to-r from-[#6C5CE7] via-[#8357EB] to-[#A363D9] text-white shadow-[0_8px_16px_rgba(108,92,231,0.35)] hover:shadow-[0_10px_24px_rgba(108,92,231,0.45)]"
                      }
                      disabled:cursor-not-allowed disabled:opacity-60`}
                      >
                        <span
                          className={`grid h-4 w-4 place-items-center rounded-full border transition
                        ${
                          isFollowed
                            ? "border-transparent bg-[#696969] text-white"
                            : "border-white/70 bg-white/10 text-white"
                        }
                        ${isPending ? "animate-spin" : ""}`}
                        >
                          <Icon className="h-3 w-3" strokeWidth={2.5} />
                        </span>
                        <span>{isPending ? "Working..." : label}</span>
                      </button>
                    ) : undefined
                  }
                />
              );
            })
          : emptyState ?? null}
      </div>
    </section>
  );
}
