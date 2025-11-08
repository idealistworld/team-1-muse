/**
 * ProfileCard - Renders an individual profile card with avatar and connection count
 * Used to display creator profiles in various sections of the dashboard
 */
import type { ReactNode } from "react";

interface ProfileCardProps {
  name: string;
  connections: string;
  action?: ReactNode;
}

const AVATAR_COLORS = [
  "#6366F1", // Indigo
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#14B8A6", // Teal
  "#F59E0B", // Amber
  "#EF4444", // Rose
  "#06B6D4", // Cyan
  "#84CC16", // Lime
];

function getColorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function ProfileCard({ name, connections, action }: ProfileCardProps) {
  const avatarColor = getColorForName(name);

  return (
    <div className="flex w-full items-center justify-between rounded-xl bg-white border border-[#E1E1E1] px-3 py-3">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 flex-shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            fill="none"
            className="h-full w-full"
          >
            <path
              d="M48 24C48 37.2548 37.2548 48 24 48C10.7452 48 0 37.2548 0 24C0 10.7452 10.7452 0 24 0C37.2548 0 48 10.7452 48 24Z"
              fill={avatarColor}
            />
            <path
              d="M24 24C26.7614 24 29 21.7614 29 19C29 16.2386 26.7614 14 24 14C21.2386 14 19 16.2386 19 19C19 21.7614 21.2386 24 24 24Z"
              fill="white"
            />
            <path
              d="M24 27C19.5817 27 16 30.5817 16 35H32C32 30.5817 28.4183 27 24 27Z"
              fill="white"
            />
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-[#696969]">
            {name}
          </span>
          <span className="text-xs font-normal text-[#696969]">
            {connections}
          </span>
        </div>
      </div>
      {action ? <div className="flex-shrink-0">{action}</div> : null}
    </div>
  );
}
