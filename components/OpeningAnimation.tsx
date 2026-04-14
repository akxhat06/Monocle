"use client";

/**
 * OpeningAnimation — "Shattered Assembly" concept
 *
 * Individual dashboard blocks (header, 3 KPI cards, area chart, bar chart, SQL row)
 * start scattered across the screen and fly inward from different directions,
 * assembling into the final dashboard card with a satisfying snap.
 *
 * Timeline:
 *   0–600ms  : background + particles fade in, blocks fly toward center
 *   300ms    : first blocks arrive, content animates in
 *   600ms    : final snap, card fully assembled, border glows on
 *   3200ms   : exit starts
 *   3900ms   : done → null
 */

import { useEffect, useMemo, useRef, useState } from "react";
import MonocleMarkAnimated from "@/components/brand/MonocleMarkAnimated";
import { PRODUCT_NAME, PRODUCT_TAGLINE } from "@/lib/brand";

// ── KPI counter ───────────────────────────────────────────────────────────────

type KpiCfg = { label: string; target: number; format: "k" | "pct" | "ms"; delta: string; up: boolean };
const KPI_CFG: KpiCfg[] = [
  { label: "Sessions",   target: 24.8, format: "k",   delta: "+12%",  up: true  },
  { label: "Conversion", target: 3.2,  format: "pct", delta: "+0.4%", up: true  },
  { label: "Latency",    target: 142,  format: "ms",  delta: "−8%",   up: false },
];

function fmt(v: number, f: KpiCfg["format"]) {
  if (f === "k")   return `${v.toFixed(1)}k`;
  if (f === "pct") return `${v.toFixed(1)}%`;
  return `${Math.round(v)}ms`;
}

function useCountUp(target: number, ms: number, delay: number, active: boolean) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const t0 = performance.now() + delay;
    const tick = (now: number) => {
      if (now < t0) { raf = requestAnimationFrame(tick); return; }
      const p = Math.min(1, (now - t0) / ms);
      setV(target * (1 - (1 - p) ** 3));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setV(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms, delay, active]);
  return v;
}

// ── SVG paths ─────────────────────────────────────────────────────────────────

const LINE_A = "M0 72 C30 64 55 50 90 46 S140 58 178 50 S218 30 260 36 S308 52 344 40 S392 20 420 26";
const LINE_B = "M0 82 C40 74 72 60 112 66 S160 78 196 68 S234 48 272 56 S320 70 358 58 S396 44 420 50";
const AREA_A = `${LINE_A} V100 H0 Z`;
const AREA_B = `${LINE_B} V100 H0 Z`;
const BAR_H  = [0.38, 0.62, 0.47, 0.80, 0.55, 0.91, 0.68, 0.45, 0.74, 0.58, 0.86, 0.52];

// ── "SQL rows" — text data flying in ─────────────────────────────────────────

const SQL_ROWS = [
  { key: "users",     val: "2,000",   color: "#a78bfa" },
  { key: "calls",     val: "4,907",   color: "#60a5fa" },
  { key: "questions", val: "8,000",   color: "#34d399" },
  { key: "errors",    val: "1,000",   color: "#f87171" },
];

// ── Particles ─────────────────────────────────────────────────────────────────

const PARTICLES = [
  { l:"5%", t:"14%", d:"0s",   s:3 }, { l:"13%", t:"68%", d:"0.3s",  s:2 },
  { l:"21%", t:"35%", d:"0.7s", s:4 }, { l:"76%", t:"18%", d:"0.2s",  s:3 },
  { l:"88%", t:"55%", d:"0.5s", s:2 }, { l:"93%", t:"80%", d:"0.9s",  s:3 },
  { l:"4%",  t:"50%", d:"1.1s", s:2 }, { l:"50%", t:"7%",  d:"0.4s",  s:4 },
  { l:"66%", t:"87%", d:"0.8s", s:3 }, { l:"37%", t:"91%", d:"0.2s",  s:2 },
  { l:"72%", t:"40%", d:"0.6s", s:3 }, { l:"18%", t:"8%",  d:"1.0s",  s:2 },
  { l:"57%", t:"72%", d:"0.35s",s:4 }, { l:"84%", t:"33%", d:"0.75s", s:2 },
  { l:"29%", t:"58%", d:"0.9s", s:3 }, { l:"45%", t:"25%", d:"0.15s", s:2 },
];

// ── Floating data nodes (background depth) ────────────────────────────────────

const DEPTH_NODES = [
  { l:"8%",  t:"22%", size:40, opacity:0.08, delay:"0s"   },
  { l:"85%", t:"15%", size:60, opacity:0.06, delay:"0.3s" },
  { l:"15%", t:"75%", size:50, opacity:0.07, delay:"0.6s" },
  { l:"78%", t:"68%", size:35, opacity:0.09, delay:"0.2s" },
  { l:"50%", t:"88%", size:45, opacity:0.05, delay:"0.8s" },
  { l:"92%", t:"42%", size:55, opacity:0.06, delay:"0.4s" },
];

// ── Block entry animations ────────────────────────────────────────────────────
// Each block has a start position (transform) and flies to its natural position.
// "snap" delay is when it arrives.

type BlockAnim = {
  from: string;   // CSS transform at start (far position)
  snapMs: number; // ms until block arrives
  dur: number;    // ms flight duration
};

const BLOCK: Record<string, BlockAnim> = {
  header: { from: "translateY(-120px) scale(0.88)",   snapMs: 0,   dur: 540 },
  kpi0:   { from: "translateX(-180px) translateY(-60px) scale(0.82)", snapMs: 80,  dur: 560 },
  kpi1:   { from: "translateY(-160px) scale(0.85)",   snapMs: 120, dur: 580 },
  kpi2:   { from: "translateX(180px) translateY(-60px) scale(0.82)", snapMs: 80,  dur: 560 },
  chart:  { from: "translateY(140px) scale(0.85)",    snapMs: 160, dur: 600 },
  bars:   { from: "translateX(-160px) translateY(80px) scale(0.80)", snapMs: 200, dur: 620 },
  sql:    { from: "translateX(180px) translateY(80px) scale(0.80)",  snapMs: 200, dur: 620 },
};

// ── Main component ────────────────────────────────────────────────────────────

export default function OpeningAnimation() {
  const [phase, setPhase] = useState<"in" | "assembled" | "exit" | "done">("in");

  useEffect(() => {
    // All blocks arrive by ~700ms → trigger "assembled" glow
    const a  = window.setTimeout(() => setPhase("assembled"), 720);
    const ex = window.setTimeout(() => setPhase("exit"),      3300);
    const dn = window.setTimeout(() => setPhase("done"),      4000);
    return () => { clearTimeout(a); clearTimeout(ex); clearTimeout(dn); };
  }, []);

  const exiting = phase === "exit" || phase === "done";
  const assembled = phase === "assembled" || phase === "exit";

  const v0 = useCountUp(24.8, 1000, 750,  !exiting);
  const v1 = useCountUp(3.2,  1000, 870,  !exiting);
  const v2 = useCountUp(142,  1000, 990,  !exiting);
  const kpiVals = useMemo(() => [v0, v1, v2], [v0, v1, v2]);

  if (phase === "done") return null;

  // Shared block style factory
  const blockStyle = (key: keyof typeof BLOCK): React.CSSProperties => {
    const b = BLOCK[key];
    return {
      opacity: exiting ? 0 : 1,
      transform: exiting ? b.from : "none",
      transition: exiting
        ? `opacity 380ms ease, transform 380ms ease`
        : `opacity ${b.dur}ms cubic-bezier(0.22,1,0.36,1) ${b.snapMs}ms,
           transform ${b.dur}ms cubic-bezier(0.22,1,0.36,1) ${b.snapMs}ms`,
      // Start state is applied via animation-fill-mode in CSS below
    };
  };

  return (
    <div
      className={`oa-overlay${exiting ? " oa-fade" : ""}`}
      aria-busy="true"
      aria-label="Loading"
    >
      {/* Rich background */}
      <div className="oa-backdrop" aria-hidden />
      <div className="oa-grid-bg" aria-hidden />

      {/* Depth nodes — large blurry circles in background */}
      {DEPTH_NODES.map((n, i) => (
        <div
          key={i}
          aria-hidden
          style={{
            position: "absolute",
            left: n.l, top: n.t,
            width: n.size, height: n.size,
            borderRadius: "50%",
            border: "1px solid rgba(167,139,250,0.18)",
            opacity: 0,
            animation: `oa-spark-pop 600ms ease-out ${n.delay} forwards`,
            boxShadow: `0 0 ${n.size}px rgba(139,92,246,0.12)`,
          }}
        />
      ))}

      {/* Particles */}
      <div className="oa-particles" aria-hidden>
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="oa-particle"
            style={{ left: p.l, top: p.t, animationDelay: p.d, width: p.s, height: p.s }}
          />
        ))}
      </div>

      {/* ── Orbit ring around the assembled card ───────────────────────── */}
      <div className={`oa-orbit ${exiting ? "oa-orbit-stop" : ""}`} aria-hidden
        style={{ opacity: assembled ? 0.5 : 0, transition: "opacity 400ms ease 200ms" }}
      >
        <span className="oa-orbit-track" />
        <span className="oa-orbit-sweep">
          <span className="oa-orbit-dot" />
        </span>
      </div>

      {/* ── Scattered data fragments that fly INTO the card (z-index: 1, behind card) ── */}
      {SQL_ROWS.map((row, i) => {
        // Position them at corners/edges of the screen so they visibly travel inward
        const positions = [
          { left: "6%",  top: "20%" },   // top-left
          { left: "80%", top: "12%" },   // top-right
          { left: "4%",  top: "72%" },   // bottom-left
          { left: "78%", top: "70%" },   // bottom-right
        ];
        const pos = positions[i];
        return (
          <div
            key={row.key}
            aria-hidden
            style={{
              position: "absolute",
              ...pos,
              zIndex: 1, // behind the card (card is z-index: 3)
              display: "flex",
              alignItems: "center",
              gap: 7,
              background: "rgba(24,24,28,0.75)",
              border: `1px solid ${row.color}22`,
              borderRadius: 8,
              padding: "5px 10px",
              fontSize: 11,
              fontFamily: "monospace",
              backdropFilter: "blur(6px)",
              whiteSpace: "nowrap",
              opacity: 0,
              // Appear briefly then fade out before assembled state
              animation: [
                `oa-spark-pop 300ms ease-out ${200 + i * 80}ms forwards`,
                `oa-frag-out 350ms ease-in ${620 + i * 40}ms forwards`,
              ].join(", "),
            }}
          >
            <span style={{ color: "rgba(255,255,255,0.28)", fontSize: 10 }}>SELECT</span>
            <span style={{ color: row.color, fontWeight: 600 }}>{row.key}</span>
            <span style={{ color: "rgba(255,255,255,0.18)" }}>→</span>
            <span style={{ color: "#d0d0d0", fontWeight: 600 }}>{row.val}</span>
          </div>
        );
      })}

      {/* ── Assembled card ─────────────────────────────────────────────── */}
      <div
        style={{
          position: "relative",
          zIndex: 3,
          width: "min(560px, calc(100vw - 40px))",
          filter: assembled
            ? "drop-shadow(0 32px 80px rgba(0,0,0,0.7)) drop-shadow(0 0 60px rgba(139,92,246,0.14))"
            : "drop-shadow(0 16px 40px rgba(0,0,0,0.5))",
          transition: "filter 400ms ease",
        }}
      >
        <div
          style={{
            borderRadius: 18,
            background: "linear-gradient(165deg, rgba(26,26,26,0.97) 0%, rgba(18,18,18,0.99) 100%)",
            border: `1px solid ${assembled ? "rgba(167,139,250,0.28)" : "rgba(255,255,255,0.07)"}`,
            boxShadow: assembled
              ? "inset 0 1px 0 rgba(255,255,255,0.05), 0 0 0 1px rgba(0,0,0,0.5), 0 0 48px rgba(139,92,246,0.10)"
              : "inset 0 1px 0 rgba(255,255,255,0.03), 0 0 0 1px rgba(0,0,0,0.4)",
            padding: "20px 20px 16px",
            overflow: "hidden",
            transition: "border-color 400ms ease, box-shadow 400ms ease",
          }}
        >
          {/* Shimmer sweep */}
          <div className="oa-dash-shimmer" aria-hidden />

          {/* ── Header block ─────────────────────────────────── */}
          <div style={blockStyle("header")}>
            <header className="oa-dash-header">
              <div className="oa-dash-brand">
                <div className="oa-logo"><MonocleMarkAnimated size={36} /></div>
                <div className="oa-dash-brand-text">
                  <span className="oa-dash-title">{PRODUCT_NAME}</span>
                  <span className="oa-dash-tagline">{PRODUCT_TAGLINE}</span>
                </div>
              </div>
              <span className="oa-dash-live">
                <span className="oa-dash-live-dot" aria-hidden />
                Live metrics
              </span>
            </header>
          </div>

          {/* ── 3 KPI cards ──────────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
            {KPI_CFG.map((k, i) => (
              <div
                key={k.label}
                style={{
                  ...blockStyle(`kpi${i}` as keyof typeof BLOCK),
                  padding: "11px 13px",
                  borderRadius: 11,
                  background: "rgba(30,30,30,0.90)",
                  border: assembled
                    ? `1px solid rgba(167,139,250,0.20)`
                    : "1px solid rgba(255,255,255,0.07)",
                  transition: [
                    `opacity ${BLOCK[`kpi${i}`].dur}ms cubic-bezier(0.22,1,0.36,1) ${BLOCK[`kpi${i}`].snapMs}ms`,
                    `transform ${BLOCK[`kpi${i}`].dur}ms cubic-bezier(0.22,1,0.36,1) ${BLOCK[`kpi${i}`].snapMs}ms`,
                    "border-color 400ms ease 500ms",
                  ].join(", "),
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#5a5a5a", marginBottom: 5 }}>
                  {k.label}
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#f0f0f0", letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums", lineHeight: 1.2 }}>
                  {fmt(kpiVals[i], k.format)}
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, marginTop: 4, color: k.up ? "#a78bfa" : "#60a5fa" }}>
                  {k.delta}
                </div>
              </div>
            ))}
          </div>

          {/* ── Area chart block ─────────────────────────────── */}
          <div style={{ ...blockStyle("chart"), marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#c0c0c0" }}>Traffic</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "rgba(160,160,160,0.8)" }}>
                <span className="oa-scanline" />
                Last 7 days
              </span>
            </div>
            <div style={{
              borderRadius: 10,
              overflow: "hidden",
              background: "linear-gradient(180deg, rgba(20,18,30,0.55) 0%, rgba(15,15,20,0.4) 100%)",
              boxShadow: "inset 0 0 0 1px rgba(167,139,250,0.10)",
              position: "relative",
            }}>
              <svg viewBox="0 0 420 100" style={{ display: "block", width: "100%", height: 80 }} preserveAspectRatio="none" aria-hidden>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#a78bfa" stopOpacity="0.40" />
                    <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.02" />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#60a5fa" stopOpacity="0.24" />
                    <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.01" />
                  </linearGradient>
                  <filter id="lg" x="-20%" y="-50%" width="140%" height="200%">
                    <feGaussianBlur stdDeviation="2.5" result="b" />
                    <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>
                {[25,50,75].map(y => (
                  <line key={y} x1="0" y1={y} x2="420" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="4 6" />
                ))}
                <path d={AREA_B}  fill="url(#g2)" className="oa-area-fill" />
                <path d={LINE_B}  fill="none" stroke="#60a5fa" strokeWidth="1.6" strokeLinecap="round" className="oa-chart-line-soft" opacity="0.75" />
                <path d={AREA_A}  fill="url(#g1)" className="oa-area-fill" />
                <path d={LINE_A}  fill="none" stroke="#a78bfa" strokeWidth="2.2" strokeLinecap="round" className="oa-chart-line" filter="url(#lg)" />
                {!exiting && (
                  <g filter="url(#lg)">
                    <circle r="5" fill="#c4b5fd"><animateMotion dur="2.6s" repeatCount="indefinite" path={LINE_A} /></circle>
                    <circle r="2.5" fill="#ede9fe"><animateMotion dur="2.6s" repeatCount="indefinite" path={LINE_A} /></circle>
                  </g>
                )}
              </svg>
              <div className="oa-chart-sweep" aria-hidden />
            </div>
          </div>

          {/* ── Bar chart block ──────────────────────────────── */}
          <div style={blockStyle("bars")}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 48 }}>
              {BAR_H.map((h, i) => {
                const tops = ["#a78bfa","#818cf8","#8b5cf6"];
                const bots = ["#6d28d9","#6366f1","#7c3aed"];
                return (
                  <div
                    key={i}
                    style={{ flex: 1, height: `${Math.round(h * 100)}%`, alignSelf: "flex-end" }}
                  >
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "3px 3px 1px 1px",
                        background: `linear-gradient(180deg, ${tops[i % 3]} 0%, ${bots[i % 3]} 100%)`,
                        boxShadow: "0 0 8px rgba(167,139,250,0.20)",
                        transformOrigin: "bottom center",
                        transform: "scaleY(0)",
                        animation: `oa-bar-grow 480ms cubic-bezier(0.2,0.85,0.35,1) ${850 + i * 40}ms forwards`,
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <p className="oa-caption" aria-hidden>{PRODUCT_TAGLINE}</p>
    </div>
  );
}
