"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ColDef<T extends Record<string, unknown>> = {
  key: keyof T & string;
  header: string;
  width?: string;
  align?: "left" | "right" | "center";
  render?: (value: T[keyof T], row: T) => React.ReactNode;
};

type Props<T extends Record<string, unknown>> = {
  title: string;
  subtitle?: string;
  endpoint: string;
  columns: ColDef<T>[];
  defaultParams?: Record<string, string>;
  extraFilters?: React.ReactNode;
  pageSize?: number;
  from: string;
  to: string;
};

type ApiResponse<T> = {
  page: number;
  limit: number;
  total: number;
  rows: T[];
  error?: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(v: unknown): string {
  if (!v) return "—";
  try {
    return new Date(String(v)).toLocaleString(undefined, {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: false,
    });
  } catch { return String(v); }
}

// ── Skeleton row ──────────────────────────────────────────────────────────────

function SkeletonRow({ cols, index }: { cols: number; index: number }) {
  const widths = [48, 32, 65, 40, 55, 38, 50, 42];
  return (
    <tr className="border-b border-white/[0.04]">
      {Array.from({ length: cols }).map((_, ci) => (
        <td key={ci} className="px-4 py-3.5">
          <div
            className="h-3 rounded-md bg-white/[0.06] animate-pulse"
            style={{
              width: `${widths[(ci + index) % widths.length]}%`,
              animationDelay: `${index * 0.04 + ci * 0.015}s`,
            }}
          />
        </td>
      ))}
    </tr>
  );
}

// ── Page button ───────────────────────────────────────────────────────────────

function PageBtn({
  onClick, disabled, active = false, children,
}: {
  onClick: () => void; disabled: boolean; active?: boolean; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex h-7 min-w-[28px] items-center justify-center rounded-lg px-1 text-[11px] font-medium transition
        ${active
          ? "bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/30"
          : "text-[#6a6a6a] hover:bg-white/[0.06] hover:text-[#d0d0d0] disabled:opacity-25 disabled:cursor-not-allowed"
        }`}
    >
      {children}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DataTable<T extends Record<string, unknown>>({
  title,
  subtitle,
  endpoint,
  columns,
  defaultParams = {},
  extraFilters,
  pageSize = 10,
  from,
  to,
}: Props<T>) {
  const [rows, setRows]         = useState<T[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [search, setSearch]     = useState("");
  const [inputVal, setInputVal] = useState("");
  const [extraParams]           = useState<Record<string, string>>(defaultParams);
  const abortRef                = useRef<AbortController | null>(null);

  const load = useCallback(async (p: number, q: string, ep: Record<string, string>) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      from, to,
      page: String(p),
      limit: String(pageSize),
      ...(q ? { search: q } : {}),
      ...ep,
    });
    try {
      const res  = await fetch(`${endpoint}?${params}`, { credentials: "same-origin", signal: ctrl.signal });
      const body = (await res.json()) as ApiResponse<T>;
      if (!res.ok || body.error) throw new Error(body.error ?? res.statusText);
      setRows(body.rows);
      setTotal(body.total);
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setError(e instanceof Error ? e.message : "Failed to load");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [endpoint, from, to, pageSize]);

  useEffect(() => {
    setPage(1);
    void load(1, search, extraParams);
  }, [load, search, extraParams]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const goTo = (p: number) => {
    const clamped = Math.max(1, Math.min(totalPages, p));
    setPage(clamped);
    void load(clamped, search, extraParams);
  };

  // Page number windows
  const pageNums: number[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pageNums.push(i);
  } else {
    pageNums.push(1);
    if (page > 3) pageNums.push(-1); // ellipsis
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pageNums.push(i);
    if (page < totalPages - 2) pageNums.push(-2); // ellipsis
    pageNums.push(totalPages);
  }

  const startRow = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRow   = Math.min(page * pageSize, total);

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#111111]">

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-6 py-4">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight text-[#f0f0f0]">{title}</h2>
            {subtitle && <p className="mt-0.5 text-[11px] text-[#5a5a5a]">{subtitle}</p>}
          </div>
          {/* Live count badge */}
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold tabular-nums transition-all ${
            loading
              ? "bg-white/[0.04] text-[#4a4a4a]"
              : "bg-violet-500/12 text-violet-300 ring-1 ring-violet-500/20"
          }`}>
            {loading ? "·  ·  ·" : total.toLocaleString()}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {extraFilters}

          {/* Search */}
          <div className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 transition-colors ${
            inputVal
              ? "border-violet-500/30 bg-violet-500/[0.05]"
              : "border-white/[0.07] bg-white/[0.03]"
          }`}>
            <svg className="h-3.5 w-3.5 shrink-0 text-[#5a5a5a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder="Search…"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setSearch(inputVal.trim());
              }}
              className="w-40 bg-transparent text-[12px] text-[#e0e0e0] placeholder:text-[#3a3a3a] outline-none"
            />
            {inputVal && (
              <button type="button" onClick={() => { setInputVal(""); setSearch(""); }}
                className="flex h-4 w-4 items-center justify-center rounded-full bg-white/[0.08] text-[#7a7a7a] transition hover:bg-white/[0.14] hover:text-[#d0d0d0]">
                <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Table area ───────────────────────────────────────────────── */}
      <div className="relative min-h-0 flex-1 overflow-auto">
        {error ? (
          <div className="m-6 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3.5 text-[13px] text-red-400">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {error}
          </div>
        ) : (
          <table className="w-full border-collapse">
            {/* Sticky thead */}
            <thead className="sticky top-0 z-10">
              <tr>
                {columns.map((col, i) => (
                  <th
                    key={col.key}
                    style={{ width: col.width }}
                    className={`border-b border-white/[0.06] bg-[#161616] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#4a4a4a] whitespace-nowrap
                      ${i === 0 ? "rounded-tl-none" : ""}
                      ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"}`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                Array.from({ length: pageSize }).map((_, ri) => (
                  <SkeletonRow key={ri} cols={columns.length} index={ri} />
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length}>
                    <div className="flex flex-col items-center gap-3 py-20 text-center">
                      <svg className="h-10 w-10 text-[#2a2a2a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" />
                      </svg>
                      <p className="text-[13px] font-medium text-[#3a3a3a]">No data found</p>
                      <p className="text-[11px] text-[#2a2a2a]">Try adjusting the date range or search query</p>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row, ri) => (
                  <tr
                    key={ri}
                    className={`group border-b border-white/[0.03] transition-colors hover:bg-violet-500/[0.04] ${
                      ri % 2 === 0 ? "bg-transparent" : "bg-white/[0.012]"
                    }`}
                  >
                    {columns.map((col) => {
                      const val = row[col.key];
                      return (
                        <td
                          key={col.key}
                          className={`px-4 py-3 text-[12.5px] leading-snug text-[#c8c8c8]
                            ${col.align === "right" ? "text-right tabular-nums" : col.align === "center" ? "text-center" : ""}`}
                        >
                          {col.render ? col.render(val, row) : (
                            col.key.includes("_at") || col.key.includes("datetime")
                              ? <span className="tabular-nums text-[#7a7a7a]">{fmtDate(val)}</span>
                              : val === null || val === undefined
                                ? <span className="text-[#2a2a2a]">—</span>
                                : String(val)
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination ────────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center justify-between border-t border-white/[0.06] bg-[#161616] px-6 py-3">
        {/* Row range info */}
        <p className="text-[11px] text-[#5a5a5a]">
          {loading || total === 0 ? (
            <span className="text-[#3a3a3a]">—</span>
          ) : (
            <>
              <span className="font-medium text-[#8a8a8a]">{startRow.toLocaleString()}–{endRow.toLocaleString()}</span>
              {" of "}
              <span className="font-medium text-[#8a8a8a]">{total.toLocaleString()}</span>
              {" rows"}
            </>
          )}
        </p>

        {/* Page controls */}
        <div className="flex items-center gap-1">
          {/* First */}
          <PageBtn onClick={() => goTo(1)} disabled={page === 1 || loading}>
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
            </svg>
          </PageBtn>
          {/* Prev */}
          <PageBtn onClick={() => goTo(page - 1)} disabled={page === 1 || loading}>
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </PageBtn>

          <div className="flex items-center gap-0.5 px-1">
            {pageNums.map((p, i) =>
              p < 0 ? (
                <span key={p * 100 + i} className="flex h-7 w-6 items-center justify-center text-[11px] text-[#3a3a3a]">
                  ···
                </span>
              ) : (
                <PageBtn key={p} onClick={() => goTo(p)} disabled={loading} active={p === page}>
                  {p}
                </PageBtn>
              )
            )}
          </div>

          {/* Next */}
          <PageBtn onClick={() => goTo(page + 1)} disabled={page === totalPages || loading}>
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </PageBtn>
          {/* Last */}
          <PageBtn onClick={() => goTo(totalPages)} disabled={page === totalPages || loading}>
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 4.5l7.5 7.5-7.5 7.5m6-15l7.5 7.5-7.5 7.5" />
            </svg>
          </PageBtn>
        </div>
      </div>
    </div>
  );
}
