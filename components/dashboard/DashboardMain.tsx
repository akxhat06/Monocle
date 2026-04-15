"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useSound } from "@/lib/hooks/useSound";
import {
  AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { previousRange, shiftDays, toYmd } from "@/lib/overview/date-range";
import type {
  OverviewCounts,
  OverviewCountsResponse,
  OverviewDisplayMetricKey,
} from "@/lib/overview/types";

// ── Chart data types ─────────────────────────────────────────────────────────
type TrendRow   = { day: string; calls: number; questions: number; errors: number; asr: number; tts: number; users: number };
type ChannelRow = { channel: string; questions: number };

const METRIC_ROWS: {
  key: OverviewDisplayMetricKey;
  title: string;
  trendKey: keyof OverviewCounts;
}[] = [
  { key: "users",      title: "Users",     trendKey: "usersActiveInRange"  },
  { key: "calls",      title: "Calls",     trendKey: "callsInRange"        },
  { key: "questions",  title: "Questions", trendKey: "questionsInRange"    },
  { key: "errors",     title: "Errors",    trendKey: "errorsInRange"       },
  { key: "asrDetails", title: "ASR",       trendKey: "asrDetailsInRange"   },
  { key: "ttsDetails", title: "TTS",       trendKey: "ttsDetailsInRange"   },
];

type MetricTheme = {
  hex: string;
  hexDim: string;
  iconWrap: string;
  iconRing: string;
  badge: string;
  badgeText: string;
};

const METRIC_THEME: Record<OverviewDisplayMetricKey, MetricTheme> = {
  users: {
    hex: "#a78bfa", hexDim: "rgba(167,139,250,0.18)",
    iconWrap: "bg-violet-500/10", iconRing: "ring-violet-500/20",
    badge: "bg-violet-500/10",   badgeText: "text-violet-300",
  },
  calls: {
    hex: "#60a5fa", hexDim: "rgba(96,165,250,0.18)",
    iconWrap: "bg-blue-500/10",   iconRing: "ring-blue-500/20",
    badge: "bg-blue-500/10",     badgeText: "text-blue-300",
  },
  questions: {
    hex: "#34d399", hexDim: "rgba(52,211,153,0.18)",
    iconWrap: "bg-emerald-500/10", iconRing: "ring-emerald-500/20",
    badge: "bg-emerald-500/10",   badgeText: "text-emerald-300",
  },
  errors: {
    hex: "#fb7185", hexDim: "rgba(251,113,133,0.18)",
    iconWrap: "bg-rose-500/10",   iconRing: "ring-rose-500/20",
    badge: "bg-rose-500/10",     badgeText: "text-rose-300",
  },
  asrDetails: {
    hex: "#fbbf24", hexDim: "rgba(251,191,36,0.18)",
    iconWrap: "bg-amber-500/10",  iconRing: "ring-amber-500/20",
    badge: "bg-amber-500/10",    badgeText: "text-amber-300",
  },
  ttsDetails: {
    hex: "#2dd4bf", hexDim: "rgba(45,212,191,0.18)",
    iconWrap: "bg-teal-500/10",   iconRing: "ring-teal-500/20",
    badge: "bg-teal-500/10",     badgeText: "text-teal-300",
  },
};

/** The date from which we have meaningful data. Default start for "All" range. */
const DATA_START = "2026-02-17";
const RANGE_ALL_FROM = DATA_START;

// ── Sparkline data generation ─────────────────────────────────────────────────

function sparkSeries(prev: number, curr: number, n = 20): number[] {
  const lp = Math.log1p(Math.max(0, prev));
  const lc = Math.log1p(Math.max(0, curr));
  const denom = Math.max(lp, lc, 0.35) + 0.2;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const blend = lp + (lc - lp) * t;
    const wave =
      Math.sin((i / n) * Math.PI * 2.4 + 0.3) * 0.22 +
      Math.sin((i / n) * Math.PI * 5.1 + 1.1) * 0.10;
    const norm = (blend / denom) * 0.88 + wave + 0.08;
    out.push(Math.max(0.04, Math.min(0.98, norm)));
  }
  return out;
}

function pctChangeLabel(prev: number, curr: number): { pct: string; up: boolean; flat: boolean } {
  if (prev === 0 && curr === 0) return { pct: "0%", up: true, flat: true };
  if (prev === 0) return { pct: "New", up: true, flat: false };
  const raw = ((curr - prev) / prev) * 100;
  const up = raw >= 0;
  const abs = Math.abs(raw);
  let pct: string;
  if (abs >= 100) pct = `${Math.round(abs)}%`;
  else if (abs >= 10) pct = `${abs.toFixed(0)}%`;
  else pct = `${abs.toFixed(1)}%`;
  return { pct, up, flat: Math.abs(raw) < 0.05 };
}

// ── SparkAreaChart — full-width area + line at card bottom ───────────────────

function SparkAreaChart({ values, color, hexDim }: { values: number[]; color: string; hexDim: string }) {
  const uid = useId().replace(/:/g, "");
  const W = 280;
  const H = 64;
  const PAD_X = 0;
  const PAD_Y = 4;

  const pts = values.map((v, i) => {
    const x = PAD_X + (i / (values.length - 1)) * (W - PAD_X * 2);
    const y = H - PAD_Y - v * (H - PAD_Y * 2);
    return { x, y };
  });

  const linePath = pts
    .map((p, i) => {
      if (i === 0) return `M${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      // Smooth cubic bezier
      const prev = pts[i - 1];
      const cpx = (prev.x + p.x) / 2;
      return `C${cpx.toFixed(1)},${prev.y.toFixed(1)} ${cpx.toFixed(1)},${p.y.toFixed(1)} ${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    })
    .join(" ");

  const areaPath = `${linePath} L${(W - PAD_X).toFixed(1)},${H} L${PAD_X},${H} Z`;

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      aria-hidden
      style={{ display: "block", overflow: "visible" }}
    >
      <defs>
        <linearGradient id={`sg-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id={`sl-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="1"   />
        </linearGradient>
      </defs>
      {/* Area fill */}
      <path d={areaPath} fill={`url(#sg-${uid})`} />
      {/* Line */}
      <path d={linePath} fill="none" stroke={`url(#sl-${uid})`} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      {/* End dot */}
      {pts.length > 0 && (
        <>
          <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="3.5" fill={color} opacity="0.9" />
          <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="6" fill={color} opacity="0.18" />
        </>
      )}
    </svg>
  );
}

// ── MetricIcon ────────────────────────────────────────────────────────────────

function MetricIcon({ metric }: { metric: OverviewDisplayMetricKey }) {
  const cls = "h-4.5 w-4.5";
  switch (metric) {
    case "users":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.118a7.5 7.5 0 0115 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      );
    case "calls":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
        </svg>
      );
    case "questions":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
        </svg>
      );
    case "errors":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      );
    case "asrDetails":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
        </svg>
      );
    case "ttsDetails":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
        </svg>
      );
    default:
      return null;
  }
}

// ── KpiCardShell ──────────────────────────────────────────────────────────────

function KpiCardShell({
  title,
  valueDisplay,
  loading,
  theme,
  metricKey,
  prev,
  curr,
  trendPrev,
  trendCurr,
}: {
  title: string;
  valueDisplay: string;
  loading: boolean;
  theme: MetricTheme;
  metricKey: OverviewDisplayMetricKey;
  prev: number;
  curr: number;
  trendPrev?: number;
  trendCurr?: number;
}) {
  const tp = trendPrev ?? prev;
  const tc = trendCurr ?? curr;
  const sparkValues = useMemo(() => sparkSeries(tp, tc), [tp, tc]);
  const trend = useMemo(() => pctChangeLabel(tp, tc), [tp, tc]);

  return (
    <div
      className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-[#1a1a1a] transition-all duration-200 hover:border-white/[0.12] hover:bg-[#1e1e1e]"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.35), 0 8px 24px -12px rgba(0,0,0,0.4)" }}
    >
      {/* Subtle top accent line */}
      <div
        className="absolute inset-x-0 top-0 h-px opacity-60"
        style={{ background: `linear-gradient(90deg, transparent, ${theme.hex}55, transparent)` }}
        aria-hidden
      />

      {/* Card body */}
      <div className="flex flex-1 flex-col gap-0 px-4 pt-4 pb-0">

        {/* Top row: value + icon */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {loading ? (
              <>
                <div className="h-8 w-24 animate-pulse rounded-lg bg-white/[0.07]" />
                <div className="mt-2 h-3.5 w-16 animate-pulse rounded bg-white/[0.05]" />
              </>
            ) : (
              <>
                <p className="text-xl font-bold tabular-nums tracking-tight text-[#f0f0f0] leading-none">
                  {valueDisplay}
                </p>
                <p className="mt-1 text-[10px] font-medium text-[#5a5a5a] uppercase tracking-widest">
                  {title}
                </p>
              </>
            )}
          </div>

          {/* Icon */}
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ${theme.iconWrap} ${theme.iconRing}`}
            style={{ color: theme.hex }}
            aria-hidden
          >
            <MetricIcon metric={metricKey} />
          </div>
        </div>

        {/* Delta badge */}
        <div className="mt-3 flex items-center gap-2">
          {loading ? (
            <div className="h-5 w-16 animate-pulse rounded-full bg-white/[0.07]" />
          ) : (
            <>
              <span
                className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-white/[0.05] ${theme.badge} ${theme.badgeText}`}
              >
                {trend.flat ? (
                  <span>0%</span>
                ) : (
                  <>
                    {trend.up ? (
                      <svg className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="none" aria-hidden>
                        <path d="M2 8L6 3l4 5" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <svg className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="none" aria-hidden>
                        <path d="M2 4L6 9l4-5" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    {trend.pct}
                  </>
                )}
              </span>
              <span className="text-[10px] text-[#3a3a3a]">vs prior period</span>
            </>
          )}
        </div>
      </div>

      {/* Sparkline — flush to card edges */}
      <div className="mt-3 w-full" style={{ height: 48 }}>
        {loading ? (
          <div className="h-full animate-pulse bg-white/[0.03]" />
        ) : (
          <SparkAreaChart values={sparkValues} color={theme.hex} hexDim={theme.hexDim} />
        )}
      </div>
    </div>
  );
}

// ── Chart tooltip style ───────────────────────────────────────────────────────
const TOOLTIP_STYLE = {
  background: "#242424",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 8,
  fontSize: 12,
  color: "#f0f0f0",
};

const TOOLTIP_LABEL_STYLE = { color: "#f0f0f0", fontWeight: 600 };
const TOOLTIP_ITEM_STYLE  = { color: "#c0c0c0" };

function fmtTick(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  // Show exact numbers with comma separators — no rounding to k
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(v);
}

function fmtDay(d: string): string {
  try {
    return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch { return d; }
}

// ── DashboardMain ─────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  try {
    return new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  } catch { return d; }
}

export default function DashboardMain() {
  const today = toYmd(new Date());

  const [from, setFrom] = useState(RANGE_ALL_FROM);
  const [to, setTo]     = useState(today);
  const [counts,     setCounts]     = useState<OverviewCounts | null>(null);
  const [prevCounts, setPrevCounts] = useState<OverviewCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  // Actual DB data range
  const [dbEarliest, setDbEarliest] = useState<string | null>(null);
  const [dbLatest,   setDbLatest]   = useState<string | null>(null);

  // Chart data
  const [trendRows,   setTrendRows]   = useState<TrendRow[]>([]);
  const [channelRows, setChannelRows] = useState<ChannelRow[]>([]);
  const [chartsLoading, setChartsLoading] = useState(true);

  const { startThinking, stopThinking } = useSound();
  const prevLoadingRef = useRef(false);

  useEffect(() => {
    if (!prevLoadingRef.current && loading) startThinking();
    else if (prevLoadingRef.current && !loading) stopThinking();
    prevLoadingRef.current = loading;
  }, [loading, startThinking, stopThinking]);

  // Fetch actual DB date range once on mount
  useEffect(() => {
    fetch("/api/overview/range", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((body: { earliest?: string | null; latest?: string | null }) => {
        if (body.earliest) setDbEarliest(body.earliest);
        if (body.latest)   setDbLatest(body.latest);
      })
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setChartsLoading(true);
    setError(null);
    const prev = previousRange(from, to);
    const qs = (path: string) =>
      fetch(`/api/overview/${path}?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, {
        credentials: "same-origin",
      });
    const q = (f: string, t: string) =>
      fetch(`/api/overview/counts?from=${encodeURIComponent(f)}&to=${encodeURIComponent(t)}`, {
        credentials: "same-origin",
      });
    try {
      const [resCur, resPrev, resTrend, resCh] = await Promise.all([
        q(from, to), q(prev.from, prev.to),
        qs("trend"), qs("channels"),
      ]);
      const bodyCur  = (await resCur.json())  as OverviewCountsResponse & { error?: string };
      const bodyPrev = (await resPrev.json()) as OverviewCountsResponse & { error?: string };
      if (!resCur.ok)  throw new Error(bodyCur.error  || resCur.statusText);
      if (!resPrev.ok) throw new Error(bodyPrev.error || resPrev.statusText);
      setCounts(bodyCur.counts);
      setPrevCounts(bodyPrev.counts);

      const bodyTrend = await resTrend.json() as { rows?: TrendRow[] };
      const bodyCh    = await resCh.json()    as { rows?: ChannelRow[] };
      setTrendRows(bodyTrend.rows ?? []);
      setChannelRows(bodyCh.rows ?? []);
    } catch (e) {
      setCounts(null);
      setPrevCounts(null);
      setError(e instanceof Error ? e.message : "Could not load metrics");
    } finally {
      setLoading(false);
      setChartsLoading(false);
    }
  }, [from, to]);

  useEffect(() => { void load(); }, [load]);

  const [activePreset, setActivePreset] = useState<number | "all">("all");

  const applyPreset = (days: number | "all") => {
    const end = toYmd(new Date());
    setActivePreset(days);
    if (days === "all") { setFrom(RANGE_ALL_FROM); setTo(end); return; }
    setFrom(shiftDays(end, -days));
    setTo(end);
  };

  // If user manually edits the date inputs, clear the active preset highlight
  const handleFromChange = (v: string) => { setFrom(v); setActivePreset("custom" as never); };
  const handleToChange   = (v: string) => { setTo(v);   setActivePreset("custom" as never); };

  // Exact number formatting — no rounding, just locale commas
  const nf = useMemo(() => new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }), []);

  return (
    <div className="space-y-4 p-4 lg:p-6">

      {/* Header row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#f0f0f0]">Overview</h1>
          <p className="mt-0.5 text-xs text-[#4a4a4a]">Platform metrics across all time ranges</p>
        </div>

        {/* Filter bar */}
        <div className="w-max max-w-full">
          <div
            className="monocle-glass-filter inline-flex flex-wrap items-center gap-x-2 gap-y-2 rounded-2xl px-3 py-2"
            role="group"
            aria-label="Date range"
          >
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => applyPreset("all")}
                className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition ${
                  activePreset === "all"
                    ? "border-violet-500/30 bg-violet-500/[0.08] text-violet-300"
                    : "border-white/[0.07] bg-white/[0.03] text-[#5a5a5a] hover:border-violet-500/25 hover:text-violet-300"
                }`}
              >
                All
              </button>
              {([7, 30] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => applyPreset(d)}
                  className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition ${
                    activePreset === d
                      ? "border-violet-500/30 bg-violet-500/[0.08] text-violet-300"
                      : "border-white/[0.07] bg-white/[0.03] text-[#5a5a5a] hover:border-violet-500/25 hover:text-violet-300"
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
            <span className="hidden h-5 w-px shrink-0 bg-white/[0.07] sm:block" aria-hidden />
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#4a4a4a]">From</span>
                <input
                  type="date" value={from} max={to} min={DATA_START}
                  onChange={(e) => handleFromChange(e.target.value)}
                  className="h-8 max-w-[9.25rem] rounded-lg border border-white/[0.07] bg-white/[0.04] px-2.5 text-xs text-[#f0f0f0] outline-none transition focus:border-violet-500/40 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.12)]"
                />
              </label>
              <label className="flex items-center gap-1.5">
                <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#4a4a4a]">To</span>
                <input
                  type="date" value={to} min={from} max={today}
                  onChange={(e) => handleToChange(e.target.value)}
                  className="h-8 max-w-[9.25rem] rounded-lg border border-white/[0.07] bg-white/[0.04] px-2.5 text-xs text-[#f0f0f0] outline-none transition focus:border-violet-500/40 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.12)]"
                />
              </label>
              <button
                type="button" onClick={() => void load()} disabled={loading}
                className="h-8 shrink-0 rounded-lg bg-violet-600 px-3.5 text-xs font-semibold tracking-wide text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] transition hover:bg-violet-500 disabled:opacity-40"
              >
                {loading ? "…" : "Apply"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Data availability note — small inline chip */}
      {(dbEarliest || dbLatest) && (
        <div className="flex items-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/25 bg-orange-500/[0.07] px-3 py-1 text-[11px] text-orange-400/70">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-400 shrink-0" aria-hidden />
            Data available from{" "}
            <span className="font-semibold text-orange-300">{dbEarliest ? fmtDate(dbEarliest) : "—"}</span>
            {" "}to{" "}
            <span className="font-semibold text-orange-300">{dbLatest ? fmtDate(dbLatest) : "—"}</span>
          </span>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-950/35 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Metric grid — 2 col mobile, 3 col md, 6 col xl */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {METRIC_ROWS.map(({ key, title, trendKey }) => {
          // Display the in-range count (e.g. callsInRange) so the number
          // reflects the selected date window, not the all-time total.
          const curr = counts?.[trendKey] ?? 0;
          const prev = prevCounts?.[trendKey] ?? 0;
          return (
            <KpiCardShell
              key={key}
              title={title}
              valueDisplay={nf.format(curr)}
              loading={loading}
              theme={METRIC_THEME[key]}
              metricKey={key}
              prev={prev}
              curr={curr}
              trendPrev={prev}
              trendCurr={curr}
            />
          );
        })}
      </div>

      {/* ── Chart row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">


        {/* 1. All metrics trend — takes 2/3 width */}
        {(() => {
          const SERIES = [
            { key: "calls",     label: "Calls",     color: "#60a5fa" },
            { key: "questions", label: "Questions",  color: "#a78bfa" },
            { key: "asr",       label: "ASR",        color: "#fbbf24" },
            { key: "tts",       label: "TTS",        color: "#2dd4bf" },
            { key: "errors",    label: "Errors",     color: "#fb7185" },
            { key: "users",     label: "Users",      color: "#34d399" },
          ];
          return (
            <div className="lg:col-span-2 rounded-2xl border border-white/[0.07] bg-[#1a1a1a] p-4"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.35)" }}>
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-[#f0f0f0]">Activity Trend</h2>
                  <p className="text-[11px] text-[#4a4a4a] mt-0.5">All metrics over selected period</p>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  {SERIES.map(s => (
                    <span key={s.key} className="flex items-center gap-1.5 text-[10px] text-[#7a7a7a]">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ background: s.color }} />
                      {s.label}
                    </span>
                  ))}
                </div>
              </div>
              {chartsLoading ? (
                <div className="h-36 animate-pulse rounded-xl bg-white/[0.03]" />
              ) : trendRows.length === 0 ? (
                <div className="flex h-36 items-center justify-center text-xs text-[#3a3a3a]">No data for this range</div>
              ) : (
                <ResponsiveContainer width="100%" height={150}>
                  <AreaChart data={trendRows.map(r => ({ ...r, day: fmtDay(r.day) }))}
                    margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      {SERIES.map(s => (
                        <linearGradient key={s.key} id={`g-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={s.color} stopOpacity={0.20} />
                          <stop offset="95%" stopColor={s.color} stopOpacity={0.01} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="day" stroke="transparent" tick={{ fill: "#5a5a5a", fontSize: 10 }}
                      tickLine={false} interval="preserveStartEnd" />
                    <YAxis stroke="transparent" tick={{ fill: "#5a5a5a", fontSize: 10 }}
                      tickLine={false} axisLine={false} tickFormatter={fmtTick} width={36} />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      labelStyle={TOOLTIP_LABEL_STYLE}
                      itemStyle={TOOLTIP_ITEM_STYLE}
                      formatter={(value, name) => [
                        fmtTick(Number(value)),
                        SERIES.find(s => s.key === name)?.label ?? String(name),
                      ]}
                      cursor={{ stroke: "rgba(255,255,255,0.06)" }}
                    />
                    {SERIES.map(s => (
                      <Area key={s.key} type="monotone" dataKey={s.key}
                        stroke={s.color} strokeWidth={1.5}
                        fill={`url(#g-${s.key})`} dot={false} />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          );
        })()}

        {/* 2. Questions by Channel — 1/3 width */}
        <div className="rounded-2xl border border-white/[0.07] bg-[#1a1a1a] p-4"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.35)" }}>
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-[#f0f0f0]">Questions by Channel</h2>
            <p className="text-[11px] text-[#4a4a4a] mt-0.5">Voice vs Chat breakdown</p>
          </div>
          {chartsLoading ? (
            <div className="flex flex-col gap-3">
              <div className="h-2 w-full animate-pulse rounded-full bg-white/[0.05]" />
              <div className="h-2 w-full animate-pulse rounded-full bg-white/[0.05]" style={{ animationDelay: "0.15s" }} />
              <div className="mt-3 h-8 w-1/2 animate-pulse rounded-lg bg-white/[0.04]" style={{ animationDelay: "0.3s" }} />
            </div>
          ) : channelRows.length === 0 ? (
            <div className="flex h-36 items-center justify-center text-xs text-[#3a3a3a]">No data</div>
          ) : (() => {
            const COLORS = ["#a78bfa", "#60a5fa"];
            const total = channelRows.reduce((s, r) => s + r.questions, 0);
            return (
              <div className="flex flex-col gap-3">
                {/* Radial progress bars */}
                {channelRows.map((r, i) => {
                  const pct = total > 0 ? (r.questions / total) * 100 : 0;
                  const color = COLORS[i % COLORS.length];
                  return (
                    <div key={r.channel} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: color }} />
                          <span className="text-[12px] font-medium text-[#c0c0c0]">{r.channel}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-semibold tabular-nums text-[#f0f0f0]">{fmtTick(r.questions)}</span>
                          <span className="text-[11px] tabular-nums text-[#4a4a4a] w-8 text-right">{pct.toFixed(0)}%</span>
                        </div>
                      </div>
                      {/* Track + fill bar */}
                      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className="absolute left-0 top-0 h-full rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: `${pct}%`,
                            background: `linear-gradient(90deg, ${color}99, ${color})`,
                            boxShadow: `0 0 8px ${color}66`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}

                {/* Total */}
                <div className="mt-2 flex items-center justify-between border-t border-white/[0.05] pt-3">
                  <span className="text-[11px] text-[#4a4a4a] uppercase tracking-wider">Total</span>
                  <span className="text-[15px] font-bold tabular-nums text-[#f0f0f0]">{fmtTick(total)}</span>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

    </div>
  );
}
