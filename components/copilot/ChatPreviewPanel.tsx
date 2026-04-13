"use client";

import { useEffect, useRef, useState } from "react";
import type { OverviewCounts, OverviewCountsResponse } from "@/lib/overview/types";
import KpiCard from "@/components/widgets/KpiCard";
import BarChartWidget from "@/components/widgets/BarChartWidget";
import LineChartWidget from "@/components/widgets/LineChartWidget";
import MonocleMarkAnimated from "@/components/brand/MonocleMarkAnimated";

const SUGGESTIONS = [
  "Give me a platform overview",
  "How are calls trending this month?",
  "What are the most common errors?",
  "Show ASR latency over time",
];

function fmtCount(n: number | undefined): string {
  if (n === undefined) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

interface Props {
  onClose: () => void;
  onSubmit: (query: string) => void;
}

export default function ChatPreviewPanel({ onClose, onSubmit }: Props) {
  const [query, setQuery] = useState("");
  const [counts, setCounts] = useState<OverviewCounts | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Fetch real counts
  useEffect(() => {
    fetch("/api/overview/counts", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((body: OverviewCountsResponse & { error?: string }) => {
        if (body.counts) setCounts(body.counts);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  return (
    /* Full-screen blurred overlay — click outside to close */
    <div className="fixed inset-0 z-[48] flex flex-col items-center justify-between bg-black/50 backdrop-blur-md px-4 py-8">

      {/* Close button — top right */}
      <div className="flex w-full max-w-2xl justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-white/[0.08] bg-zinc-900/80 p-2 text-zinc-500 transition hover:border-emerald-500/35 hover:text-zinc-200"
          aria-label="Close"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* ── CENTER CONTENT — AGUI preview ─────────────────────────────────── */}
      <div className="flex w-full max-w-2xl flex-1 flex-col justify-center gap-4 overflow-y-auto py-4">

        {/* Header */}
        <div className="flex flex-col items-center gap-1">
          <MonocleMarkAnimated size={72} title="Monocle AI" />
          <div className="flex items-center gap-2 mt-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">Monocle AI</span>
          </div>
          <p className="text-sm text-zinc-500">Ask anything — I&apos;ll query your data and build a live dashboard.</p>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-4 gap-2">
          <KpiCard label="Users"     value={fmtCount(counts?.users)}     compact />
          <KpiCard label="Calls"     value={fmtCount(counts?.calls)}     compact />
          <KpiCard label="Questions" value={fmtCount(counts?.questions)} compact />
          <KpiCard label="Errors"    value={fmtCount(counts?.errors)}    compact />
        </div>

        {/* Charts side by side */}
        <div className="grid grid-cols-2 gap-2">
          <BarChartWidget
            title="Questions by Channel"
            data={[
              { channel: "Voice", questions: 1420000 },
              { channel: "Chat",  questions: 305696  },
            ]}
            xKey="channel"
            yKeys={["questions"]}
            chartHeight={160}
          />
          <LineChartWidget
            title="Calls Trend"
            data={[
              { day: "Mon", calls: 820  },
              { day: "Tue", calls: 950  },
              { day: "Wed", calls: 1100 },
              { day: "Thu", calls: 870  },
              { day: "Fri", calls: 1230 },
              { day: "Sat", calls: 650  },
              { day: "Sun", calls: 480  },
            ]}
            xKey="day"
            yKeys={["calls"]}
            chartHeight={160}
          />
        </div>

        {/* Suggestion chips */}
        <div className="grid grid-cols-2 gap-2">
          {SUGGESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => handleSubmit(q)}
              className="rounded-xl border border-zinc-700/60 bg-zinc-900/60 px-4 py-2.5 text-left text-xs text-zinc-400 transition hover:border-emerald-500/40 hover:bg-zinc-900/90 hover:text-zinc-200"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* ── BOTTOM — floating input bar (same position as before) ──────────── */}
      <div className="w-full max-w-xl pb-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(query);
          }}
          className="flex w-full items-center gap-3 rounded-full border border-emerald-500/30 bg-zinc-950/95 px-4 py-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.55)] ring-1 ring-white/[0.04] backdrop-blur-md"
        >
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask an analytics question..."
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent text-[15px] text-zinc-200 placeholder:text-slate-500/90 outline-none"
            aria-label="Message assistant"
          />
          <button
            type="submit"
            disabled={!query.trim()}
            className="shrink-0 rounded-full p-1.5 text-emerald-400 transition-colors hover:text-emerald-300 disabled:opacity-30"
            aria-label="Send message"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
