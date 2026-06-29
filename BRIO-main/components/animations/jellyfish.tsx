"use client";

import { cn } from "@/lib/utils";

interface JellyfishProps {
  className?: string;
  /** width in px */
  size?: number;
  /** unique id used for the gradient defs (must be stable per instance) */
  uid: string;
  colorFrom?: string;
  colorTo?: string;
}

/**
 * A stylised, translucent jellyfish rendered as SVG.
 * The bell glows softly and the tentacles gently sway via CSS.
 */
export default function Jellyfish({
  className,
  size = 120,
  uid,
  colorFrom = "#b388ff",
  colorTo = "#7c3aed",
}: JellyfishProps) {
  const gradId = `jelly-bell-${uid}`;
  const glowId = `jelly-glow-${uid}`;

  return (
    <svg
      width={size}
      height={size * 1.6}
      viewBox="0 0 120 192"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("select-none", className)}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={gradId} cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor={colorFrom} stopOpacity="0.95" />
          <stop offset="60%" stopColor={colorTo} stopOpacity="0.65" />
          <stop offset="100%" stopColor={colorTo} stopOpacity="0.15" />
        </radialGradient>
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Bell / dome */}
      <g filter={`url(#${glowId})`}>
        <path
          d="M10 64 C10 28 35 6 60 6 C85 6 110 28 110 64 C110 74 104 80 96 80 C92 80 88 77 86 72 C84 79 78 82 72 80 C68 79 65 75 64 70 C62 76 58 80 52 80 C46 80 42 76 40 70 C38 76 34 80 28 80 C20 80 14 74 10 64 Z"
          fill={`url(#${gradId})`}
          stroke={colorFrom}
          strokeOpacity="0.35"
          strokeWidth="1"
        />
        {/* inner highlight */}
        <ellipse cx="60" cy="36" rx="30" ry="20" fill={colorFrom} fillOpacity="0.18" />
        <ellipse cx="48" cy="28" rx="9" ry="6" fill="#ffffff" fillOpacity="0.35" />
      </g>

      {/* Tentacles */}
      <g className="animate-tentacle" stroke={colorTo} strokeWidth="3" strokeLinecap="round" opacity="0.7">
        <path d="M30 76 C26 100 34 120 28 148 C26 158 30 168 26 182" />
        <path d="M44 78 C40 104 48 124 42 152 C40 164 44 174 40 186" />
        <path d="M60 80 C58 106 64 128 60 156 C58 168 62 178 60 190" />
        <path d="M76 78 C80 104 72 124 78 152 C80 164 76 174 80 186" />
        <path d="M90 76 C94 100 86 120 92 148 C94 158 90 168 94 182" />
      </g>
      <g className="animate-tentacle" style={{ animationDelay: "1.5s" }} stroke={colorFrom} strokeWidth="1.5" strokeLinecap="round" opacity="0.5">
        <path d="M37 78 C34 100 40 122 36 150" />
        <path d="M52 80 C50 104 56 126 52 154" />
        <path d="M68 80 C70 104 64 126 70 154" />
        <path d="M83 78 C86 100 80 122 84 150" />
      </g>
    </svg>
  );
}
