/**
 * MuseAvatar - Animated avatar for the Muse AI Assistant
 */
"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface MuseAvatarProps {
  isActive?: boolean;
  size?: "sm" | "md" | "lg";
}

export function MuseAvatar({ isActive = false, size = "md" }: MuseAvatarProps) {
  const sizeClasses = {
    sm: "h-16 w-16",
    md: "h-20 w-20",
    lg: "h-24 w-24",
  };

  const logoSizes = {
    sm: 32,
    md: 40,
    lg: 48,
  };

  return (
    <div className={cn("relative shrink-0", sizeClasses[size])}>
      {/* Main gradient circle */}
      <div
        className={cn(
          "absolute inset-0 rounded-full transition-all duration-500",
          isActive
            ? "bg-gradient-to-br from-[#5578C8] via-[#6B88D8] to-[#7B9EE8] shadow-[0_0_40px_rgba(85,120,200,0.6)] animate-pulse"
            : "bg-gradient-to-br from-[#5578C8] to-[#7B9EE8] shadow-[0_0_20px_rgba(85,120,200,0.3)]"
        )}
      >
        {/* Glossy overlay */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/30 via-white/10 to-transparent" />
      </div>

      {/* Outer spinning ring */}
      {isActive && (
        <div
          className="absolute -inset-2 rounded-full border-2 border-transparent border-t-white/70 border-r-white/50 animate-spin"
          style={{ animationDuration: "2s" }}
        />
      )}

      {/* Middle spinning ring (reverse direction) */}
      {isActive && (
        <div
          className="absolute -inset-1 rounded-full border-2 border-transparent border-b-[#5578C8]/60 border-l-[#5578C8]/40"
          style={{ animation: "spin 3s linear infinite reverse" }}
        />
      )}

      {/* Inner pulsing glow */}
      {isActive && (
        <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
      )}

      {/* Muse Logo */}
      <div className="absolute inset-0 flex items-center justify-center p-5 z-10">
        <Image
          src="/logo.png"
          alt="Muse"
          width={logoSizes[size]}
          height={logoSizes[size]}
          className={cn(
            "transition-all duration-500 brightness-0 invert drop-shadow-lg",
            isActive && "scale-110 animate-pulse"
          )}
          style={{
            mixBlendMode: "normal",
          }}
        />
      </div>

      {/* Orbiting particles */}
      {isActive && (
        <>
          <div
            className="absolute top-0 left-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]"
            style={{
              animation: "orbit 4s linear infinite",
              transformOrigin: "0 40px",
            }}
          />
          <div
            className="absolute top-0 left-1/2 w-1 h-1 bg-white rounded-full shadow-[0_0_6px_rgba(255,255,255,0.6)]"
            style={{
              animation: "orbit 3s linear infinite",
              animationDelay: "1.5s",
              transformOrigin: "0 40px",
            }}
          />
        </>
      )}

      <style jsx>{`
        @keyframes orbit {
          from {
            transform: rotate(0deg) translateX(0);
          }
          to {
            transform: rotate(360deg) translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
