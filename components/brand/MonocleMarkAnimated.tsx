"use client";

import { useId } from "react";

/**
 * Animated Monocle mark: one central lens with orbiting “views” (mini charts).
 * Use inline (this component) so CSS animations run; `<img src="…svg">` will not animate.
 */

type Props = {
  className?: string;
  /** Pixel width/height (square). */
  size?: number;
  title?: string;
};

export default function MonocleMarkAnimated({ className = "", size = 160, title }: Props) {
  const uid = useId().replace(/:/g, "");
  const idGrad = `mm-lens-grad-${uid}`;
  const idGlow = `mm-glow-${uid}`;

  return (
    <svg
      className={`monocle-mark-svg ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={title ? "img" : "presentation"}
      aria-hidden={title ? false : true}
      aria-label={title}
    >
      <defs>
        <linearGradient id={idGrad} x1="80" y1="28" x2="80" y2="132" gradientUnits="userSpaceOnUse">
          <stop stopColor="#86efac" />
          <stop offset="1" stopColor="#15803d" />
        </linearGradient>
        <filter id={idGlow} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Orbiting dashed ring */}
      <g className="mm-orbit">
        <circle
          cx="80"
          cy="80"
          r="54"
          stroke={`url(#${idGrad})`}
          strokeWidth="1.2"
          strokeDasharray="8 14"
          opacity="0.55"
        />
      </g>

      {/* Three “view” mini-panels around the lens */}
      <g className="mm-view mm-view-a" transform="translate(80 22)">
        <rect x="-9" y="-7" width="18" height="14" rx="3" stroke="#4ade80" strokeWidth="1" opacity="0.5" />
        <rect x="-6" y="1" width="3" height="5" rx="0.5" fill="#4ade80" className="mm-bar" />
        <rect x="-1" y="-1" width="3" height="7" rx="0.5" fill="#4ade80" className="mm-bar mm-bar-mid" />
        <rect x="4" y="2" width="3" height="4" rx="0.5" fill="#4ade80" className="mm-bar" />
      </g>
      <g className="mm-view mm-view-b" transform="translate(128 96)">
        <rect x="-9" y="-7" width="18" height="14" rx="3" stroke="#4ade80" strokeWidth="1" opacity="0.5" />
        <rect x="-6" y="1" width="3" height="5" rx="0.5" fill="#4ade80" className="mm-bar" />
        <rect x="-1" y="-1" width="3" height="7" rx="0.5" fill="#4ade80" className="mm-bar mm-bar-mid" />
        <rect x="4" y="2" width="3" height="4" rx="0.5" fill="#4ade80" className="mm-bar" />
      </g>
      <g className="mm-view mm-view-c" transform="translate(32 96)">
        <rect x="-9" y="-7" width="18" height="14" rx="3" stroke="#4ade80" strokeWidth="1" opacity="0.5" />
        <rect x="-6" y="1" width="3" height="5" rx="0.5" fill="#4ade80" className="mm-bar" />
        <rect x="-1" y="-1" width="3" height="7" rx="0.5" fill="#4ade80" className="mm-bar mm-bar-mid" />
        <rect x="4" y="2" width="3" height="4" rx="0.5" fill="#4ade80" className="mm-bar" />
      </g>

      {/* Central lens */}
      <g filter={`url(#${idGlow})`} className="mm-lens">
        <circle cx="80" cy="80" r="40" stroke={`url(#${idGrad})`} strokeWidth="2.4" className="mm-lens-outer" />
        <circle cx="80" cy="80" r="28" stroke="#4ade80" strokeWidth="1.3" opacity="0.65" />
        <circle cx="80" cy="80" r="5" fill="#4ade80" className="mm-lens-core" />
      </g>

      {/* Spark line inside lens (subtle) */}
      <path
        className="mm-spark"
        d="M52 88 Q64 82 72 84 T88 78 T104 72"
        stroke="#4ade80"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.45"
      />
    </svg>
  );
}
