"use client";

import { useState } from "react";
import DataTable, { ColDef } from "@/components/tables/DataTable";
import { shiftDays, toYmd } from "@/lib/overview/date-range";

const DATA_START = "2026-02-17";

type ErrorRow = {
  id: string;
  uid: string;
  sid: string;
  channel: string;
  errortext: string;
  created_at: string;
};

const ERROR_COLS: ColDef<ErrorRow>[] = [
  { key: "created_at", header: "Time", width: "160px" },
  {
    key: "uid", header: "User ID", width: "120px",
    render: (v) => <span className="font-mono text-[11px] text-[#a0a0a0]">{String(v)}</span>,
  },
  {
    key: "sid", header: "Session ID", width: "160px",
    render: (v) => <span className="font-mono text-[11px] text-[#a0a0a0]">{String(v)}</span>,
  },
  {
    key: "channel", header: "Channel", width: "100px",
    render: (v) => {
      const c = String(v ?? "");
      const isVoice = c.includes("telephony");
      return (
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
          isVoice ? "bg-violet-500/15 text-violet-300" : "bg-blue-500/12 text-blue-300"
        }`}>
          {isVoice ? "Voice" : "Chat"}
        </span>
      );
    },
  },
  {
    key: "errortext", header: "Error",
    render: (v) => (
      <span className="line-clamp-2 text-[#f87171]" title={String(v ?? "")}>
        {String(v ?? "")}
      </span>
    ),
  },
];

function RangeBar({
  from, to, setFrom, setTo, onApply,
}: {
  from: string; to: string;
  setFrom: (v: string) => void; setTo: (v: string) => void;
  onApply: () => void;
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
      <button type="button" onClick={onApply}
        className="h-7 rounded-lg bg-violet-600 px-3 text-[11px] font-semibold text-white transition hover:bg-violet-500">
        Apply
      </button>
    </div>
  );
}

export default function ErrorsPage() {
  const today = toYmd(new Date());
  const [from, setFrom]       = useState(DATA_START);
  const [to, setTo]           = useState(today);
  const [applied, setApplied] = useState({ from: DATA_START, to: today });

  return (
    <div className="flex h-full min-h-0 flex-col">
      <RangeBar from={from} to={to} setFrom={setFrom} setTo={setTo}
        onApply={() => setApplied({ from, to })} />
      <div className="min-h-0 flex-1">
        <DataTable<ErrorRow>
          title="Errors" subtitle="Error events logged during sessions"
          endpoint="/api/table/errors"
          columns={ERROR_COLS}
          from={applied.from} to={applied.to}
        />
      </div>
    </div>
  );
}
