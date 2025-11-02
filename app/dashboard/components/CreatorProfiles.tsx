/**
 * CreatorProfiles - Displays a list of creator profiles
 * Note: Currently shows all creators since the following feature hasn't been built yet
 * Shows profile cards with names and connection counts
 */
import { ProfileCard } from "./ProfileCard";
import type { Profile } from "@/types";

interface CreatorProfilesProps {
  profiles: Profile[];
  profileCount?: number;
}

export function CreatorProfiles({
  profiles,
  profileCount = 30,
}: CreatorProfilesProps) {
  return (
    <section className="flex w-[378px] flex-col items-start gap-3 rounded-2xl border border-[#E1E1E1] bg-[#FFFEFE] p-4">
      <p className="text-xs font-semibold leading-none text-[#696969] uppercase tracking-wide">
        CREATOR PROFILES •{" "}
        <span className="font-normal">{profileCount} profiles</span>
      </p>
      <div className="flex w-full flex-col space-y-2">
        {profiles.map((profile) => (
          <ProfileCard
            key={profile.id}
            name={profile.name}
            connections={profile.connections}
          />
        ))}
      </div>
    </section>
  );
}
