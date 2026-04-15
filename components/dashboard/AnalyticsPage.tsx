"use client";

import { useState } from "react";
import DataTable, { ColDef } from "@/components/tables/DataTable";
import { shiftDays, toYmd } from "@/lib/overview/date-range";

const DATA_START = "2026-02-17";

// ── Column definitions ────────────────────────────────────────────────────────

type CallRow = {
  id: number;
  interaction_id: string;
  user_id: string;
  connectivity_status: string;
  end_reason: string;
  duration_in_seconds: number;
  start_datetime: string;
  language_name: string;
  num_messages: number;
  channel_direction: string;
};

type QuestionRow = {
  id: string;
  uid: string;
  sid: string;
  channel_label: string;
  questiontext: string;
  answertext: string;
  created_at: string;
};

const CALL_COLS: ColDef<CallRow>[] = [
  {
    key: "start_datetime", header: "Time", width: "160px",
  },
  {
    key: "interaction_id", header: "Session ID", width: "180px",
    render: (v) => <span className="font-mono text-[11px] text-[#a0a0a0]">{String(v)}</span>,
  },
  { key: "user_id", header: "User ID", width: "120px",
    render: (v) => <span className="font-mono text-[11px] text-[#a0a0a0]">{String(v)}</span>,
  },
  {
    key: "connectivity_status", header: "Status", width: "100px",
    render: (v) => {
      const s = String(v ?? "");
      const color = s === "connected" ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/12 text-red-300";
      return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${color}`}>{s || "—"}</span>;
    },
  },
  { key: "language_name", header: "Language", width: "110px" },
  {
    key: "duration_in_seconds", header: "Duration", width: "90px", align: "right",
    render: (v) => {
      const s = Number(v ?? 0);
      if (s < 60) return `${s}s`;
      return `${Math.floor(s / 60)}m ${s % 60}s`;
    },
  },
  { key: "num_messages", header: "Messages", width: "90px", align: "right" },
  {
    key: "channel_direction", header: "Direction", width: "90px",
    render: (v) => {
      const d = String(v ?? "");
      return <span className={`text-[11px] ${d === "inbound" ? "text-blue-300" : "text-amber-300"}`}>{d || "—"}</span>;
    },
  },
  { key: "end_reason", header: "End Reason" },
];

const QUESTION_COLS: ColDef<QuestionRow>[] = [
  { key: "created_at", header: "Time", width: "160px" },
  {
    key: "uid", header: "User ID", width: "110px",
    render: (v) => <span className="font-mono text-[11px] text-[#a0a0a0]">{String(v)}</span>,
  },
  {
    key: "channel_label", header: "Channel", width: "80px",
    render: (v) => {
      const c = String(v ?? "");
      return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${c === "Voice" ? "bg-violet-500/15 text-violet-300" : "bg-blue-500/12 text-blue-300"}`}>{c}</span>;
    },
  },
  {
    key: "questiontext", header: "Question",
    render: (v) => (
      <span className="line-clamp-2 text-[#d0d0d0]" title={String(v ?? "")}>
        {String(v ?? "")}
      </span>
    ),
  },
  {
    key: "answertext", header: "Answer",
    render: (v) => (
      <span className="line-clamp-2 text-[#8a8a8a]" title={String(v ?? "")}>
        {String(v ?? "")}
      </span>
    ),
  },
];

// ── Date range bar (reused across tabs) ───────────────────────────────────────

function RangeBar({
  from, to, setFrom, setTo, onApply, loading,
}: {
  from: string; to: string;
  setFrom: (v: string) => void; setTo: (v: string) => void;
  onApply: () => void; loading: boolean;
}) {
  const today = toYmd(new Date());
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-white/[0.05] px-5 py-2.5">
      {([7, 30] as const).map((d) => (
        <button key={d} type="button"
          onClick={() => { setFrom(shiftDays(today, -d)); setTo(today); }}
          className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-2.5 py-1 text-[11px] text-[#9a9a9a] transition hover:border-violet-500/25 hover:text-violet-300">
          {d}d
        </button>
      ))}
      <button type="button"
        onClick={() => { setFrom(DATA_START); setTo(today); }}
        className="rounded-lg border border-violet-500/25 bg-violet-500/8 px-2.5 py-1 text-[11px] text-violet-300 transition hover:bg-violet-500/14">
        All
      </button>
      <span className="h-4 w-px bg-white/[0.07]" aria-hidden />
      <label className="flex items-center gap-1.5">
        <span className="text-[10px] text-[#5a5a5a] uppercase tracking-wider">From</span>
        <input type="date" value={from} min={DATA_START} max={to}
          onChange={(e) => setFrom(e.target.value)}
          className="h-7 rounded-lg border border-white/[0.07] bg-white/[0.04] px-2 text-[11px] text-[#e0e0e0] outline-none focus:border-violet-500/40" />
      </label>
      <label className="flex items-center gap-1.5">
        <span className="text-[10px] text-[#5a5a5a] uppercase tracking-wider">To</span>
        <input type="date" value={to} min={from} max={today}
          onChange={(e) => setTo(e.target.value)}
          className="h-7 rounded-lg border border-white/[0.07] bg-white/[0.04] px-2 text-[11px] text-[#e0e0e0] outline-none focus:border-violet-500/40" />
      </label>
      <button type="button" onClick={onApply} disabled={loading}
        className="h-7 rounded-lg bg-violet-600 px-3 text-[11px] font-semibold text-white transition hover:bg-violet-500 disabled:opacity-40">
        {loading ? "…" : "Apply"}
      </button>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AnalyticsPage({ tab }: { tab: "calls" | "questions" }) {
  const today = toYmd(new Date());
  const [from, setFrom]       = useState(DATA_START);
  const [to, setTo]           = useState(today);
  const [applied, setApplied] = useState({ from: DATA_START, to: today });
  const [channelFilter, setChannelFilter] = useState("");

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Date range bar */}
      <RangeBar from={from} to={to} setFrom={setFrom} setTo={setTo}
        onApply={() => setApplied({ from, to })} loading={false} />

      {/* Tables */}
      <div className="min-h-0 flex-1">
        {tab === "calls" && (
          <DataTable<CallRow>
            title="Calls" subtitle="All voice/chat sessions in selected range"
            endpoint="/api/table/calls"
            columns={CALL_COLS}
            from={applied.from} to={applied.to}
          />
        )}
        {tab === "questions" && (
          <DataTable<QuestionRow>
            title="Questions" subtitle="Questions asked by users via voice and chat"
            endpoint="/api/table/questions"
            columns={QUESTION_COLS}
            from={applied.from} to={applied.to}
            defaultParams={channelFilter ? { channel: channelFilter } : {}}
            extraFilters={
              <div className="flex items-center gap-1">
                {(["", "voice", "chat"] as const).map((c) => (
                  <button key={c} type="button"
                    onClick={() => setChannelFilter(c)}
                    className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition
                      ${channelFilter === c
                        ? "border-violet-500/30 bg-violet-500/10 text-violet-300"
                        : "border-white/[0.07] bg-white/[0.03] text-[#8a8a8a] hover:text-[#c0c0c0]"}`}>
                    {c === "" ? "All" : c === "voice" ? "Voice" : "Chat"}
                  </button>
                ))}
              </div>
            }
          />
        )}
      </div>
    </div>
  );
}
