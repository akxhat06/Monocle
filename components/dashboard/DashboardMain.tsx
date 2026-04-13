"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { previousRange, shiftDays, toYmd } from "@/lib/overview/date-range";
import type {
  OverviewCounts,
  OverviewCountsResponse,
  OverviewDisplayMetricKey,
} from "@/lib/overview/types";

const METRIC_ROWS: {
  key: OverviewDisplayMetricKey;
  title: string;
  trendKey: keyof OverviewCounts;
}[] = [
  { key: "users", title: "Users", trendKey: "usersActiveInRange" },
  { key: "calls", title: "Calls", trendKey: "callsInRange" },
  { key: "questions", title: "Questions", trendKey: "questionsInRange" },
  { key: "errors", title: "Errors", trendKey: "errorsInRange" },
  { key: "asrDetails", title: "ASR", trendKey: "asrDetailsInRange" },
  { key: "ttsDetails", title: "TTS", trendKey: "ttsDetailsInRange" },
];

type MetricTheme = {
  hex: string;
  iconWrap: string;
  iconRing: string;
  badge: string;
  badgeText: string;
};

const METRIC_THEME: Record<OverviewDisplayMetricKey, MetricTheme> = {
  users: {
    hex: "#4ade80",
    iconWrap: "bg-emerald-500/15",
    iconRing: "ring-emerald-500/25",
    badge: "bg-emerald-500/18",
    badgeText: "text-emerald-200",
  },
  calls: {
    hex: "#38bdf8",
    iconWrap: "bg-sky-500/15",
    iconRing: "ring-sky-500/25",
    badge: "bg-sky-500/18",
    badgeText: "text-sky-200",
  },
  questions: {
    hex: "#a78bfa",
    iconWrap: "bg-violet-500/15",
    iconRing: "ring-violet-500/25",
    badge: "bg-violet-500/18",
    badgeText: "text-violet-200",
  },
  errors: {
    hex: "#fb7185",
    iconWrap: "bg-rose-500/15",
    iconRing: "ring-rose-500/25",
    badge: "bg-rose-500/18",
    badgeText: "text-rose-200",
  },
  asrDetails: {
    hex: "#fbbf24",
    iconWrap: "bg-amber-500/15",
    iconRing: "ring-amber-500/25",
    badge: "bg-amber-500/18",
    badgeText: "text-amber-200",
  },
  ttsDetails: {
    hex: "#2dd4bf",
    iconWrap: "bg-teal-500/15",
    iconRing: "ring-teal-500/25",
    badge: "bg-teal-500/18",
    badgeText: "text-teal-200",
  },
};

/** Inclusive lower bound for “all time” counts in the UI. */
const RANGE_ALL_FROM = "2000-01-01";

function barSeriesFromCounts(prev: number, curr: number, n = 14): number[] {
  const lp = Math.log1p(Math.max(0, prev));
  const lc = Math.log1p(Math.max(0, curr));
  const denom = Math.max(lp, lc, 0.35) + 0.2;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const blend = lp + (lc - lp) * t;
    const wave = Math.sin((i / n) * Math.PI * 2.8) * 0.28;
    const norm = blend / denom - 0.55 + wave;
    out.push(Math.max(-1, Math.min(1, norm * 1.35)));
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

function MetricIcon({ metric }: { metric: OverviewDisplayMetricKey }) {
  const cls = "h-4 w-4";
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

function MiniBarChart({ values, color }: { values: number[]; color: string }) {
  const w = 100;
  const h = 36;
  const mid = h / 2;
  const maxSpan = mid - 6;
  const n = values.length;
  const gap = 2;
  const barW = (w - 16 - gap * (n - 1)) / n;
  let x = 8;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0 text-zinc-600" aria-hidden>
      <line x1={6} y1={mid} x2={w - 4} y2={mid} stroke="currentColor" strokeWidth={1} opacity={0.45} />
      <path d={`M 4 ${mid} L 6 ${mid - 3} L 6 ${mid + 3} Z`} fill="currentColor" opacity={0.35} />
      {values.map((v, i) => {
        const height = Math.abs(v) * maxSpan;
        const top = v >= 0 ? mid - height : mid;
        const el = (
          <rect
            key={i}
            x={x}
            y={top}
            width={barW}
            height={Math.max(height, v === 0 ? 2 : height)}
            rx={Math.min(barW / 2, 3)}
            ry={Math.min(barW / 2, 3)}
            fill={color}
          />
        );
        x += barW + gap;
        return el;
      })}
    </svg>
  );
}

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
  /** When set (with `trendCurr`), drives sparkline and “vs prior” instead of `prev`/`curr`. */
  trendPrev?: number;
  trendCurr?: number;
}) {
  const tp = trendPrev ?? prev;
  const tc = trendCurr ?? curr;
  const bars = useMemo(() => barSeriesFromCounts(tp, tc), [tp, tc]);
  const trend = useMemo(() => pctChangeLabel(tp, tc), [tp, tc]);

  return (
    <div className="monocle-glass-card min-w-0 rounded-xl p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {loading ? (
            <>
              <div className="h-7 w-20 animate-pulse rounded-md bg-zinc-800/90" />
              <div className="mt-1.5 h-3 w-24 animate-pulse rounded bg-zinc-800/70" />
            </>
          ) : (
            <>
              <p className="text-xl font-bold tabular-nums tracking-tight text-zinc-200">{valueDisplay}</p>
              <p className="mt-0.5 text-[11px] font-medium leading-tight text-zinc-500">{title}</p>
            </>
          )}
        </div>
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-2 ring-black/40 ${theme.iconWrap} ${theme.iconRing}`}
          style={{ color: theme.hex }}
          aria-hidden
        >
          <MetricIcon metric={metricKey} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {loading ? (
            <div className="h-6 w-[4.5rem] animate-pulse rounded-full bg-zinc-800/90" />
          ) : (
            <span
              className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-white/[0.05] ${theme.badge} ${theme.badgeText}`}
            >
              {trend.flat ? (
                <span>0%</span>
              ) : (
                <>
                  {trend.up ? (
                    <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" aria-hidden>
                      <path d="M2 8L6 3l4 5" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" aria-hidden>
                      <path d="M2 4L6 9l4-5" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {trend.pct}
                </>
              )}
            </span>
          )}
          {!loading && <span className="text-[10px] text-zinc-600">vs prior</span>}
        </div>
        {loading ? (
          <div className="h-9 w-[100px] animate-pulse rounded-md bg-zinc-800/70" />
        ) : (
          <MiniBarChart values={bars} color={theme.hex} />
        )}
      </div>
    </div>
  );
}

export default function DashboardMain() {
  const today = toYmd(new Date());

  const [from, setFrom] = useState(RANGE_ALL_FROM);
  const [to, setTo] = useState(today);
  const [counts, setCounts] = useState<OverviewCounts | null>(null);
  const [prevCounts, setPrevCounts] = useState<OverviewCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const prev = previousRange(from, to);
    const q = (f: string, t: string) =>
      fetch(`/api/overview/counts?from=${encodeURIComponent(f)}&to=${encodeURIComponent(t)}`, {
        credentials: "same-origin",
      });

    try {
      const [resCur, resPrev] = await Promise.all([q(from, to), q(prev.from, prev.to)]);
      const bodyCur = (await resCur.json()) as OverviewCountsResponse & { error?: string };
      const bodyPrev = (await resPrev.json()) as OverviewCountsResponse & { error?: string };

      if (!resCur.ok) throw new Error(bodyCur.error || resCur.statusText);
      if (!resPrev.ok) throw new Error(bodyPrev.error || resPrev.statusText);

      setCounts(bodyCur.counts);
      setPrevCounts(bodyPrev.counts);
    } catch (e) {
      setCounts(null);
      setPrevCounts(null);
      setError(e instanceof Error ? e.message : "Could not load metrics");
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  const applyPreset = (days: number | "all") => {
    const end = toYmd(new Date());
    if (days === "all") {
      setFrom(RANGE_ALL_FROM);
      setTo(end);
      return;
    }
    setFrom(shiftDays(end, -days));
    setTo(end);
  };

  const nf = useMemo(() => new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }), []);

  return (
    <div className="space-y-6 p-5 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-xl font-bold tracking-tight text-zinc-50 sm:text-2xl">Overview</h1>
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
                className="rounded-[10px] border border-emerald-500/35 bg-emerald-500/12 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-200 transition hover:border-emerald-500/50 hover:bg-emerald-500/18"
              >
                All
              </button>
              {([7, 30, 90] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => applyPreset(d)}
                  className="rounded-[10px] border border-white/[0.08] bg-black/30 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-500 transition hover:border-emerald-500/35 hover:text-emerald-200"
                >
                  {d}d
                </button>
              ))}
            </div>
            <span className="hidden h-5 w-px shrink-0 bg-zinc-600/60 sm:block" aria-hidden />
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">From</span>
                <input
                  type="date"
                  value={from}
                  max={to}
                  min={RANGE_ALL_FROM}
                  onChange={(e) => setFrom(e.target.value)}
                  className="h-9 max-w-[9.25rem] rounded-[11px] border border-[color:var(--oa-border-zinc)] bg-zinc-950/85 px-2.5 text-xs text-zinc-100 outline-none transition focus:border-emerald-500/55 focus:shadow-[0_0_0_3px_rgba(74,222,128,0.12)]"
                />
              </label>
              <label className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">To</span>
                <input
                  type="date"
                  value={to}
                  min={from}
                  max={today}
                  onChange={(e) => setTo(e.target.value)}
                  className="h-9 max-w-[9.25rem] rounded-[11px] border border-[color:var(--oa-border-zinc)] bg-zinc-950/85 px-2.5 text-xs text-zinc-100 outline-none transition focus:border-emerald-500/55 focus:shadow-[0_0_0_3px_rgba(74,222,128,0.12)]"
                />
              </label>
              <button
                type="button"
                onClick={() => void load()}
                disabled={loading}
                className="h-9 shrink-0 rounded-xl bg-[var(--neon)] px-3.5 text-xs font-extrabold tracking-wide text-[var(--oa-bg-bot)] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] transition hover:brightness-110 disabled:opacity-50"
              >
                {loading ? "…" : "Apply"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-950/35 px-4 py-3 text-sm text-red-200">{error}</div>
      )}

      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 200px), 1fr))" }}
      >
        {METRIC_ROWS.map(({ key, title, trendKey }) => {
          const curr = counts?.[key] ?? 0;
          const prev = prevCounts?.[key] ?? 0;
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
              trendPrev={prevCounts?.[trendKey] ?? 0}
              trendCurr={counts?.[trendKey] ?? 0}
            />
          );
        })}
      </div>
    </div>
  );
}
