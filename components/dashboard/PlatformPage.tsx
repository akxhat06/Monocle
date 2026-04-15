"use client";

import { useState } from "react";
// tab is now driven by the sidebar — no internal tab state needed
import DataTable, { ColDef } from "@/components/tables/DataTable";
import { shiftDays, toYmd } from "@/lib/overview/date-range";

const DATA_START = "2026-02-17";

// ── Types ─────────────────────────────────────────────────────────────────────

type ASRRow = {
  id: string;
  uid: string;
  sid: string;
  text: string;
  latencyms: number;
  success: boolean;
  apiservice: string;
  created_at: string;
};

type TTSRow = ASRRow;

// ── Shared column builder (ASR + TTS identical schema) ────────────────────────

function buildCols<T extends ASRRow>(): ColDef<T>[] {
  return [
    { key: "created_at" as keyof T & string, header: "Time", width: "160px" },
    {
      key: "uid" as keyof T & string, header: "User ID", width: "110px",
      render: (v) => <span className="font-mono text-[11px] text-[#a0a0a0]">{String(v)}</span>,
    },
    {
      key: "text" as keyof T & string, header: "Text",
      render: (v) => (
        <span className="line-clamp-2 text-[#d0d0d0]" title={String(v ?? "")}>
          {String(v ?? "")}
        </span>
      ),
    },
    {
      key: "latencyms" as keyof T & string, header: "Latency", width: "90px", align: "right",
      render: (v) => {
        const ms = Number(v ?? 0);
        const color = ms > 800 ? "text-red-300" : ms > 400 ? "text-amber-300" : "text-emerald-300";
        return <span className={`tabular-nums font-medium ${color}`}>{ms}ms</span>;
      },
    },
    {
      key: "success" as keyof T & string, header: "Status", width: "80px", align: "center",
      render: (v) => v
        ? <span className="rounded-full bg-emerald-500/12 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">OK</span>
        : <span className="rounded-full bg-red-500/12 px-2 py-0.5 text-[10px] font-semibold text-red-300">Failed</span>,
    },
    {
      key: "apiservice" as keyof T & string, header: "Service", width: "130px",
      render: (v) => {
        const s = String(v ?? "");
        const colorMap: Record<string, string> = {
          "Google-STT": "text-blue-300", "Azure-STT": "text-cyan-300",
          "BharatASR-v2": "text-violet-300", "BharatASR-v3": "text-violet-300",
          "Google-TTS": "text-blue-300", "Azure-TTS": "text-cyan-300",
          "BharatTTS-v1": "text-violet-300", "BharatTTS-v2": "text-violet-300",
        };
        return <span className={`text-[11px] font-medium ${colorMap[s] ?? "text-[#a0a0a0]"}`}>{s || "—"}</span>;
      },
    },
  ] as ColDef<T>[];
}

const ASR_COLS = buildCols<ASRRow>();
const TTS_COLS = buildCols<TTSRow>();

// ── Date range bar ────────────────────────────────────────────────────────────

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
        className="rounded-lg border border-violet-500/25 bg-violet-500/8 px-2.5 py-1 text-[11px] text-violet-300">
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

// ── Main ──────────────────────────────────────────────────────────────────────

const META = {
  asr: { title: "ASR Details",  desc: "Automatic Speech Recognition logs", endpoint: "/api/table/asr" },
  tts: { title: "TTS Details",  desc: "Text-to-Speech synthesis logs",     endpoint: "/api/table/tts" },
};

export default function PlatformPage({ tab }: { tab: "asr" | "tts" }) {
  const today = toYmd(new Date());
  const [from, setFrom]       = useState(DATA_START);
  const [to, setTo]           = useState(today);
  const [applied, setApplied] = useState({ from: DATA_START, to: today });
  const [successFilter, setSuccessFilter] = useState("");

  const { title, desc, endpoint } = META[tab];

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Date range bar */}
      <RangeBar from={from} to={to} setFrom={setFrom} setTo={setTo}
        onApply={() => setApplied({ from, to })} />

      {/* Table */}
      <div className="min-h-0 flex-1">
        <DataTable<ASRRow>
          title={title} subtitle={desc}
          endpoint={endpoint}
          columns={tab === "asr" ? ASR_COLS : TTS_COLS}
          from={applied.from} to={applied.to}
          defaultParams={successFilter ? { success: successFilter } : {}}
          extraFilters={
            <div className="flex items-center gap-1">
              {(["", "true", "false"] as const).map((s) => (
                <button key={s} type="button"
                  onClick={() => setSuccessFilter(s)}
                  className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition
                    ${successFilter === s
                      ? "border-violet-500/30 bg-violet-500/10 text-violet-300"
                      : "border-white/[0.07] bg-white/[0.03] text-[#8a8a8a] hover:text-[#c0c0c0]"}`}>
                  {s === "" ? "All" : s === "true" ? "Success" : "Failed"}
                </button>
              ))}
            </div>
          }
        />
      </div>
    </div>
  );
}
