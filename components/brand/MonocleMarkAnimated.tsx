"use client";

import { useId } from "react";

/**
 * Monocle mark — "Data Pulse" redesign.
 *
 * Concept: an analytics core with dual orbiting rings, a live chart line
 * that draws through the center, pulsing data nodes, and rising bar columns.
 *
 * Color: indigo → cyan gradient — distinct from the violet UI accent and the
 * old green, signals "data science / analytics" clearly.
 *
 * All animation is in globals.css under .monocle-mark-svg.*
 * Uses useId() so multiple instances never share filter/gradient IDs.
 */

type Props = {
  className?: string;
  /** Pixel width/height (square). */
  size?: number;
  title?: string;
};

export default function MonocleMarkAnimated({ className = "", size = 160, title }: Props) {
  const uid = useId().replace(/:/g, "");

  // Unique IDs for defs
  const idCore    = `mm2-core-${uid}`;
  const idRing1   = `mm2-ring1-${uid}`;
  const idRing2   = `mm2-ring2-${uid}`;
  const idGlow    = `mm2-glow-${uid}`;
  const idGlow2   = `mm2-glow2-${uid}`;
  const idBarGrad = `mm2-bar-${uid}`;
  const idBg      = `mm2-bg-${uid}`;

  // Chart sparkline path through the center (viewBox 0 0 160 160, center = 80,80)
  const sparkLine = "M36 88 C48 84 56 72 68 70 S80 76 92 70 S104 60 118 58 S128 62 132 60";

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
        {/* Core gradient: indigo → cyan */}
        <linearGradient id={idCore} x1="44" y1="44" x2="116" y2="116" gradientUnits="userSpaceOnUse">
          <stop stopColor="#818cf8" />        {/* indigo-400 */}
          <stop offset="0.5" stopColor="#6366f1" />
          <stop offset="1" stopColor="#22d3ee" />  {/* cyan-400 */}
        </linearGradient>

        {/* Ring 1 gradient */}
        <linearGradient id={idRing1} x1="80" y1="20" x2="80" y2="140" gradientUnits="userSpaceOnUse">
          <stop stopColor="#a5b4fc" stopOpacity="0.9" />
          <stop offset="1" stopColor="#06b6d4" stopOpacity="0.5" />
        </linearGradient>

        {/* Ring 2 gradient (reversed) */}
        <linearGradient id={idRing2} x1="140" y1="80" x2="20" y2="80" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22d3ee" stopOpacity="0.7" />
          <stop offset="1" stopColor="#818cf8" stopOpacity="0.3" />
        </linearGradient>

        {/* Bar gradient */}
        <linearGradient id={idBarGrad} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#6366f1" stopOpacity="0.9" />
          <stop offset="1" stopColor="#22d3ee" stopOpacity="0.5" />
        </linearGradient>

        {/* Subtle radial bg glow */}
        <radialGradient id={idBg} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.10" />
          <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
        </radialGradient>

        {/* Core glow filter */}
        <filter id={idGlow} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Soft outer glow filter */}
        <filter id={idGlow2} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Background radial glow ─────────────────────────────── */}
      <circle cx="80" cy="80" r="72" fill={`url(#${idBg})`} />

      {/* ── Outer orbit ring 1 — slow clockwise ───────────────── */}
      <g className="mm2-ring1">
        <circle
          cx="80" cy="80" r="58"
          stroke={`url(#${idRing1})`}
          strokeWidth="1"
          strokeDasharray="6 18"
          strokeLinecap="round"
          opacity="0.5"
        />
        {/* Data node on ring 1 */}
        <g className="mm2-node1">
          <circle cx="80" cy="22" r="4.5" fill="#a5b4fc" opacity="0.9" filter={`url(#${idGlow})`} />
          <circle cx="80" cy="22" r="8" stroke="#a5b4fc" strokeWidth="1" strokeOpacity="0.25" className="mm2-node-ring" />
        </g>
        {/* Second node, offset 180° */}
        <g className="mm2-node1b">
          <circle cx="80" cy="138" r="3.5" fill="#22d3ee" opacity="0.7" filter={`url(#${idGlow})`} />
        </g>
      </g>

      {/* ── Inner orbit ring 2 — faster counter-clockwise ─────── */}
      <g className="mm2-ring2">
        <circle
          cx="80" cy="80" r="42"
          stroke={`url(#${idRing2})`}
          strokeWidth="1.2"
          strokeDasharray="4 12"
          strokeLinecap="round"
          opacity="0.6"
        />
        {/* Data node on ring 2 */}
        <g className="mm2-node2">
          <circle cx="122" cy="80" r="4" fill="#22d3ee" opacity="0.85" filter={`url(#${idGlow})`} />
          <circle cx="122" cy="80" r="7.5" stroke="#22d3ee" strokeWidth="1" strokeOpacity="0.22" className="mm2-node-ring" />
        </g>
      </g>

      {/* ── Hexagonal core outline ─────────────────────────────── */}
      <g className="mm2-hex" filter={`url(#${idGlow2})`}>
        {/* Outer hex */}
        <polygon
          points="80,44 107,59 107,89 80,104 53,89 53,59"
          stroke={`url(#${idCore})`}
          strokeWidth="1.8"
          fill="none"
          opacity="0.75"
        />
        {/* Inner hex */}
        <polygon
          points="80,56 96,65 96,83 80,92 64,83 64,65"
          stroke={`url(#${idCore})`}
          strokeWidth="1"
          fill="none"
          opacity="0.4"
        />
        {/* Hex cross-lines */}
        <line x1="80" y1="44" x2="80" y2="56" stroke="#818cf8" strokeWidth="0.8" opacity="0.35" />
        <line x1="107" y1="59" x2="96" y2="65" stroke="#818cf8" strokeWidth="0.8" opacity="0.35" />
        <line x1="107" y1="89" x2="96" y2="83" stroke="#818cf8" strokeWidth="0.8" opacity="0.35" />
        <line x1="80" y1="104" x2="80" y2="92" stroke="#818cf8" strokeWidth="0.8" opacity="0.35" />
        <line x1="53" y1="89" x2="64" y2="83" stroke="#818cf8" strokeWidth="0.8" opacity="0.35" />
        <line x1="53" y1="59" x2="64" y2="65" stroke="#818cf8" strokeWidth="0.8" opacity="0.35" />
      </g>

      {/* ── Chart sparkline through center ─────────────────────── */}
      <path
        className="mm2-spark"
        d={sparkLine}
        stroke="#22d3ee"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.9"
        filter={`url(#${idGlow})`}
      />

      {/* ── Core pulse dot ─────────────────────────────────────── */}
      <g className="mm2-core" filter={`url(#${idGlow})`}>
        <circle cx="80" cy="80" r="7" fill={`url(#${idCore})`} opacity="0.9" />
        <circle cx="80" cy="80" r="3.5" fill="#e0e7ff" opacity="0.95" />
      </g>
      {/* Core ripple ring */}
      <circle cx="80" cy="80" r="12" stroke="#818cf8" strokeWidth="1" strokeOpacity="0" className="mm2-ripple" />

      {/* ── Rising bars at bottom ──────────────────────────────── */}
      <g className="mm2-bars" opacity="0.85">
        {/* 5 bars, evenly spaced, growing from y=118 */}
        {[
          { x: 54, h: 10, d: "0s"    },
          { x: 62, h: 16, d: "0.12s" },
          { x: 70, h: 8,  d: "0.24s" },
          { x: 78, h: 20, d: "0.08s" },
          { x: 86, h: 12, d: "0.18s" },
          { x: 94, h: 18, d: "0.06s" },
          { x: 102, h: 9, d: "0.30s" },
        ].map((b, i) => (
          <rect
            key={i}
            x={b.x}
            y={118 - b.h}
            width="5"
            height={b.h}
            rx="1.5"
            fill={`url(#${idCore})`}
            className="mm2-bar"
            style={{ animationDelay: b.d } as React.CSSProperties}
          />
        ))}
      </g>
    </svg>
  );
}
