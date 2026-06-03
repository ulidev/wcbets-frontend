import { useId } from 'react';

interface WcLogoProps {
  size?: number;
  className?: string;
}

/**
 * Soccer ball icon used as the WC Bets app logo.
 * Uses currentColor so it adapts to the surrounding context.
 * Mathematically placed pentagons on a truncated icosahedron projection.
 */
export function WcLogo({ size = 32, className }: WcLogoProps) {
  const uid = useId();
  const clipId = `wcball-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx="50" cy="50" r="44" />
        </clipPath>
      </defs>

      {/* Ball fill */}
      <circle cx="50" cy="50" r="44" fill="currentColor" opacity="0.08" />

      {/* Pentagon patches — clipped to ball boundary */}
      <g clipPath={`url(#${clipId})`} fill="currentColor">
        {/* Top center pentagon (radius 12 from center (50,22)) */}
        <path d="M50 10 L61 18 L57 32 L43 32 L39 18 Z" />
        {/* Upper-right (center ~(70,23), radius 8) */}
        <path d="M75 17 L78 26 L70 31 L62 26 L65 17 Z" />
        {/* Lower-right (center ~(82,61), radius 8) */}
        <path d="M90 64 L82 69 L74 64 L77 55 L87 55 Z" />
        {/* Bottom (center ~(50,84), radius 8) */}
        <path d="M50 92 L42 87 L45 78 L55 78 L58 87 Z" />
        {/* Lower-left (center ~(18,61), radius 8) */}
        <path d="M10 64 L13 55 L23 55 L26 64 L18 69 Z" />
        {/* Upper-left (center ~(30,23), radius 8) */}
        <path d="M25 17 L35 17 L38 26 L30 31 L22 26 Z" />
      </g>

      {/* Ball outline (drawn last to sit on top of patches) */}
      <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="4.5" />
    </svg>
  );
}
