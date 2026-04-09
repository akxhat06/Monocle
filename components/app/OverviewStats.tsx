"use client";

import { useCallback, useEffect, useState } from "react";
import type { OverviewCounts, OverviewCountsResponse } from "@/lib/overview/types";

function formatRangeLabel(from: string, to: string) {
  return `${from} → ${to}`;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toYmd(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function shiftDays(ymd: string, delta: number): string {
  const [y, m, day] = ymd.split("-").map(Number);
  const d = new Date(y, m - 1, day);
  d.setDate(d.getDate() + delta);
  return toYmd(d);
}

const METRICS: {
  key: keyof OverviewCounts;
  label: string;
  hint: string;
  accent: string;
}[] = [
  { key: "users", label: "Users", hint: "Distinct users with last seen in range", accent: "#4ade80" },
  { key: "sessions", label: "Sessions", hint: "Sessions started in range", accent: "#38bdf8" },
  { key: "questions", label: "Questions", hint: "Questions logged", accent: "#a78bfa" },
  { key: "errors", label: "Errors", hint: "Error events", accent: "#fb923c" },
  { key: "asrLogs", label: "ASR logs", hint: "Speech transcripts", accent: "#fbbf24" },
  { key: "ttsLogs", label: "TTS logs", hint: "Text-to-speech lines", accent: "#2dd4bf" },
  { key: "toolCalls", label: "Tool calls", hint: "Tool invocations", accent: "#4ade80" },
];

export default function OverviewStats() {
  const today = toYmd(new Date());
  const defaultFrom = shiftDays(today, -30);

  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(today);
  const [counts, setCounts] = useState<OverviewCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rangeLabel, setRangeLabel] = useState(formatRangeLabel(defaultFrom, today));

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/overview/counts?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, {
        credentials: "same-origin",
      });
      const body = (await res.json()) as OverviewCountsResponse & { error?: string };
      if (!res.ok) {
        throw new Error(body.error || res.statusText);
      }
      setCounts(body.counts);
      setRangeLabel(formatRangeLabel(body.from, body.to));
    } catch (e) {
      setCounts(null);
      setError(e instanceof Error ? e.message : "Could not load metrics");
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  const applyPreset = (days: number) => {
    const end = toYmd(new Date());
    const start = shiftDays(end, -days);
    setFrom(start);
    setTo(end);
  };

  const nf = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-700 bg-zinc-900/90 p-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Date range</p>
          <p className="mt-1 text-xs text-zinc-400">{rangeLabel} <span className="text-zinc-600">(UTC)</span></p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => applyPreset(7)}
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-emerald-500/40 hover:text-emerald-200"
          >
            7 days
          </button>
          <button
            type="button"
            onClick={() => applyPreset(30)}
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-emerald-500/40 hover:text-emerald-200"
          >
            30 days
          </button>
          <button
            type="button"
            onClick={() => applyPreset(90)}
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-emerald-500/40 hover:text-emerald-200"
          >
            90 days
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex flex-col gap-1 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
            From
            <input
              type="date"
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
            />
          </label>
          <label className="flex flex-col gap-1 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
            To
            <input
              type="date"
              value={to}
              min={from}
              max={today}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
            />
          </label>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="mt-5 rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/15 disabled:opacity-50 sm:mt-0"
          >
            {loading ? "Loading…" : "Apply"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/25 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {error}
          <p className="mt-2 text-xs text-red-300/80">
            Run Supabase migrations (including <code className="rounded bg-black/30 px-1">003_analytics_rls_and_indexes</code>) and
            ensure you are signed in.
          </p>
        </div>
      )}

      <div
        className="gap-3"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
        }}
      >
        {METRICS.map((m) => {
          const value = counts?.[m.key];
          return (
            <div
              key={m.key}
              className="relative overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900/95 px-4 py-4 shadow-sm"
              style={{ borderLeftWidth: 3, borderLeftColor: m.accent }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{m.label}</p>
              <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-zinc-50">
                {loading ? "—" : nf.format(value ?? 0)}
              </p>
              <p className="mt-1 text-xs leading-snug text-zinc-600">{m.hint}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
