"use client";

import { useEffect, useMemo, useState } from "react";
import MonocleMarkAnimated from "@/components/brand/MonocleMarkAnimated";
import { PRODUCT_NAME, PRODUCT_TAGLINE } from "@/lib/brand";

const BAR_H = [38, 62, 48, 78, 55, 88, 64, 42, 71, 52];

/** viewBox 0 0 420 100 — realistic up/down wave patterns */
const SERIES_PRIMARY =
  "M0 72 C30 68 50 55 84 50 S130 62 168 54 S210 30 252 38 S300 56 336 42 S390 22 420 28";
const SERIES_SECONDARY =
  "M0 80 C40 76 70 64 110 70 S155 82 190 72 S230 52 268 60 S315 74 355 62 S395 48 420 52";
const SERIES_TERTIARY =
  "M0 88 C35 84 65 76 100 82 S148 92 185 84 S225 68 260 76 S308 88 345 78 S390 62 420 68";
const CHART_AREA = `${SERIES_PRIMARY} V100 H0 Z`;

const PARTICLES = [
  { left: "6%", top: "18%", d: "0s" },
  { left: "14%", top: "72%", d: "0.4s" },
  { left: "22%", top: "38%", d: "0.8s" },
  { left: "78%", top: "22%", d: "0.2s" },
  { left: "88%", top: "58%", d: "0.6s" },
  { left: "92%", top: "82%", d: "1s" },
  { left: "4%", top: "48%", d: "1.2s" },
  { left: "52%", top: "8%", d: "0.5s" },
  { left: "68%", top: "88%", d: "0.9s" },
  { left: "38%", top: "92%", d: "0.3s" },
  { left: "72%", top: "42%", d: "0.7s" },
  { left: "18%", top: "8%", d: "1.1s" },
];

type KpiCfg = {
  label: string;
  target: number;
  format: "k" | "pct" | "ms";
  delta: string;
};

const KPI_CFG: KpiCfg[] = [
  { label: "Sessions", target: 24.8, format: "k", delta: "+12%" },
  { label: "Conversion", target: 3.2, format: "pct", delta: "+0.4%" },
  { label: "Latency", target: 142, format: "ms", delta: "−8%" },
];

function formatKpiValue(v: number, format: KpiCfg["format"]): string {
  if (format === "k") return `${v.toFixed(1)}k`;
  if (format === "pct") return `${v.toFixed(1)}%`;
  return `${Math.round(v)}ms`;
}

function useCountUp(
  target: number,
  durationMs: number,
  delayMs: number,
  active: boolean
) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const t0 = performance.now() + delayMs;

    const ease = (t: number) => 1 - (1 - t) ** 3;

    const tick = (now: number) => {
      if (now < t0) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const elapsed = now - t0;
      const p = Math.min(1, elapsed / durationMs);
      setVal(target * ease(p));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setVal(target);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, delayMs, active]);

  return val;
}

export default function OpeningAnimation() {
  const [phase, setPhase] = useState<"scene1" | "exit" | "done">("scene1");
  const exiting = phase === "exit";

  useEffect(() => {
    const ex = window.setTimeout(() => setPhase("exit"), 3000);
    const dn = window.setTimeout(() => setPhase("done"), 3700);
    return () => {
      window.clearTimeout(ex);
      window.clearTimeout(dn);
    };
  }, []);

  const v0 = useCountUp(24.8, 1100, 200, !exiting);
  const v1 = useCountUp(3.2, 1100, 320, !exiting);
  const v2 = useCountUp(142, 1100, 440, !exiting);

  const kpiValues = useMemo(() => [v0, v1, v2], [v0, v1, v2]);

  if (phase === "done") return null;

  return (
    <div
      className={`oa-overlay ${exiting ? "oa-fade" : ""}`}
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="oa-backdrop" aria-hidden />
      <div className="oa-grid-bg" aria-hidden />
      <div className="oa-particles" aria-hidden>
        {PARTICLES.map((p, i) => (
          <span key={i} className="oa-particle" style={{ left: p.left, top: p.top, animationDelay: p.d }} />
        ))}
      </div>

      <div className={`oa-scene oa-show ${exiting ? "oa-scene-exit" : ""}`}>
        <div className={`oa-orbit ${exiting ? "oa-orbit-stop" : ""}`} aria-hidden>
          <span className="oa-orbit-track" />
          <span className="oa-orbit-sweep">
            <span className="oa-orbit-dot" />
          </span>
        </div>

        <div className={`oa-dash-wrap ${exiting ? "oa-dash-wrap-stop" : ""}`}>
          <div className="oa-dash oa-from-left">
            <div className="oa-dash-shimmer" aria-hidden />

            <header className="oa-dash-header">
              <div className="oa-dash-brand">
                <div className="oa-logo">
                  <MonocleMarkAnimated size={36} />
                </div>
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

            <div className="oa-spark-row" aria-hidden>
              {[12, 18, 14, 22, 16, 24, 19, 26, 21, 28].map((h, i) => (
                <div key={i} className="oa-spark-col">
                  <div className="oa-spark-bar" style={{ height: `${h}px` }} />
                </div>
              ))}
            </div>

            <div className="oa-kpi-row">
              {KPI_CFG.map((k, i) => (
                <div
                  key={k.label}
                  className={`oa-kpi ${i % 2 === 0 ? "oa-from-left" : "oa-from-right"}`}
                  style={{ ["--oa-kpi-delay" as string]: `${180 + i * 100}ms` }}
                >
                  <span className="oa-kpi-label">{k.label}</span>
                  <span className="oa-kpi-value">
                    {formatKpiValue(kpiValues[i], k.format)}
                  </span>
                  <span className="oa-kpi-delta">{k.delta}</span>
                </div>
              ))}
            </div>

            <div className="oa-chart-block oa-from-right" style={{ animationDelay: "320ms" }}>
              <div className="oa-chart-meta">
                <span className="oa-chart-title">Traffic</span>
                <span className="oa-chart-sub">
                  <span className="oa-scanline" />
                  Last 7 days
                </span>
              </div>
              <div className="oa-chart-frame">
                <svg className="oa-chart-svg" viewBox="0 0 420 100" preserveAspectRatio="none" aria-hidden>
                  <defs>
                    <linearGradient id="oaSplashArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4ade80" stopOpacity="0.42" />
                      <stop offset="100%" stopColor="#4ade80" stopOpacity="0.02" />
                    </linearGradient>
                    <filter id="oaGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="2" result="b" />
                      <feMerge>
                        <feMergeNode in="b" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  {[22, 44, 66, 88].map((y) => (
                    <line key={y} className="oa-chart-grid" x1="0" y1={y} x2="420" y2={y} />
                  ))}
                  <path className="oa-area-fill" d={CHART_AREA} fill="url(#oaSplashArea)" />
                  <path
                    className="oa-chart-line"
                    d={SERIES_PRIMARY}
                    fill="none"
                    stroke="#4ade80"
                    strokeWidth="2.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    className="oa-chart-line-soft"
                    d={SERIES_SECONDARY}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.85"
                  />
                  <path
                    className="oa-chart-line-soft"
                    d={SERIES_TERTIARY}
                    fill="none"
                    stroke="#a78bfa"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.75"
                  />
                  {!exiting && (
                    <g filter="url(#oaGlow)">
                      <circle r="5" fill="#86efac" className="oa-chart-dot-core">
                        <animateMotion
                          dur="2.4s"
                          repeatCount="indefinite"
                          rotate="auto"
                          path={SERIES_PRIMARY}
                        />
                      </circle>
                      <circle r="2.5" fill="#f0fdf4" className="oa-chart-dot-hot">
                        <animateMotion
                          dur="2.4s"
                          repeatCount="indefinite"
                          rotate="auto"
                          path={SERIES_PRIMARY}
                        />
                      </circle>
                    </g>
                  )}
                </svg>
                <div className="oa-chart-sweep" aria-hidden />
              </div>
            </div>

            <div className="oa-bar-row" aria-hidden>
              {BAR_H.map((h, i) => (
                <div key={i} className="oa-bar-col">
                  <div
                    className="oa-bar-track"
                    style={{
                      ["--oa-bar-grow-delay" as string]: `${420 + i * 45}ms`,
                    }}
                  >
                    <div className="oa-bar" style={{ height: `${h}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <p className="oa-caption" aria-hidden>
        {PRODUCT_TAGLINE}
      </p>
    </div>
  );
}
