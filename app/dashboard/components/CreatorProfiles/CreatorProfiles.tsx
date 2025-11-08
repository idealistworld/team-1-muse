/**
 * CreatorProfiles - Displays a list of creator profiles with follow controls.
 * Shows profile cards with names, platforms, and buttons to follow or unfollow.
 */
import { ProfileCard } from "./ProfileCard";
import { CardTitle } from "../shared/CardTitle";
import type { Profile } from "@/types";

interface CreatorProfilesProps {
  profiles: Profile[];
  profileCount?: number;
  onFollow?: (creatorId: number) => void;
  onUnfollow?: (creatorId: number) => void;
  pendingCreatorIds?: Set<number>;
}

export function CreatorProfiles({
  profiles,
  profileCount = 30,
  onFollow,
  onUnfollow,
  pendingCreatorIds,
}: CreatorProfilesProps) {
  // Sort profiles: unfollowed first, then followed
  const sortedProfiles = [...profiles].sort((a, b) => {
    if (a.isFollowed === b.isFollowed) return 0;
    return a.isFollowed ? 1 : -1;
  });

  return (
    <section className="flex w-[378px] flex-col items-start gap-3 rounded-2xl border border-[#E1E1E1] bg-white p-4">
      <CardTitle title="CREATOR PROFILES" subtitle={`${profileCount} profiles`} />
      <div className="flex w-full flex-col space-y-2">
        {sortedProfiles.map((profile) => {
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

          const label = isPending ? "..." : isFollowed ? "Unfollow" : "Follow";

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
                    className={`flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer
                      ${isFollowed
                        ? "border border-[#E1E1E1] bg-white text-[#696969] hover:bg-gray-50"
                        : "bg-button-secondary text-white hover:bg-button-secondary-hover"}
                      disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {label}
                  </button>
                ) : undefined
              }
            />
          );
        })}
      </div>
    </section>
  );
}
