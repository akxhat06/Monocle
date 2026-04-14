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
  const [rows, setRows]       = useState<T[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [search, setSearch]   = useState("");
  const [inputVal, setInputVal] = useState("");

  // Extra filter state exposed via defaultParams override
  const [extraParams, setExtraParams] = useState<Record<string, string>>(defaultParams);

  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async (p: number, q: string, ep: Record<string, string>) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      from, to,
      page: String(p),
      limit: String(pageSize ?? 10),
      ...(q ? { search: q } : {}),
      ...ep,
    });

    try {
      const res = await fetch(`${endpoint}?${params}`, {
        credentials: "same-origin",
        signal: ctrl.signal,
      });
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

  const handleSearch = () => {
    setSearch(inputVal.trim());
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-3">
        <div>
          <h2 className="text-base font-semibold text-[#f0f0f0]">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-[#7a7a7a]">{subtitle}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Extra filters slot */}
          {extraFilters}

          {/* Search */}
          <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5">
            <svg className="h-3.5 w-3.5 shrink-0 text-[#5a5a5a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder="Search…"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-36 bg-transparent text-xs text-[#e0e0e0] placeholder:text-[#4a4a4a] outline-none"
            />
            {inputVal && (
              <button type="button" onClick={() => { setInputVal(""); setSearch(""); }}
                className="text-[#5a5a5a] hover:text-[#c0c0c0] transition">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Total badge */}
          <span className="rounded-full border border-white/[0.07] bg-white/[0.04] px-2.5 py-1 text-[11px] text-[#8a8a8a] tabular-nums">
            {loading ? "…" : total.toLocaleString()} rows
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="relative min-h-0 flex-1 overflow-auto px-5 pb-2">

        {error ? (
          <div className="flex h-32 items-center justify-center rounded-xl border border-red-500/25 bg-red-950/20 text-sm text-red-300">
            {error}
          </div>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    style={{ width: col.width }}
                    className={`border-b border-white/[0.06] bg-[#141414] py-2.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-[#5a5a5a] whitespace-nowrap
                      ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"}`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                /* Skeleton rows — 10 rows matching pageSize */
                Array.from({ length: 10 }).map((_, ri) => (
                  <tr key={ri} className="border-b border-white/[0.04]">
                    {columns.map((col, ci) => (
                      <td key={col.key} className="px-3 py-3">
                        <div
                          className="h-3 animate-pulse rounded-md bg-white/[0.06]"
                          style={{
                            width: `${ci === 0 ? 55 : ci === columns.length - 1 ? 40 : 45 + (ci * 13) % 35}%`,
                            animationDelay: `${ri * 0.05 + ci * 0.02}s`,
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="py-16 text-center text-[#4a4a4a]">
                    No data for this range
                  </td>
                </tr>
              ) : (
                rows.map((row, ri) => (
                  <tr
                    key={ri}
                    className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.025]"
                  >
                    {columns.map((col) => {
                      const val = row[col.key];
                      return (
                        <td
                          key={col.key}
                          className={`px-3 py-2.5 text-[12px] text-[#c8c8c8]
                            ${col.align === "right" ? "text-right tabular-nums" : col.align === "center" ? "text-center" : ""}`}
                        >
                          {col.render ? col.render(val, row) : (
                            col.key.includes("_at") || col.key.includes("datetime")
                              ? <span className="tabular-nums text-[#8a8a8a]">{fmtDate(val)}</span>
                              : val === null || val === undefined ? <span className="text-[#3a3a3a]">—</span>
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

      {/* Pagination */}
      <div className="flex shrink-0 items-center justify-between border-t border-white/[0.05] bg-[#141414] px-5 py-2.5">
        <span className="text-[11px] text-[#6a6a6a]">
          Page <span className="font-medium text-[#a0a0a0]">{page}</span> of{" "}
          <span className="font-medium text-[#a0a0a0]">{totalPages.toLocaleString()}</span>
          {" · "}
          <span className="font-medium text-[#a0a0a0]">{total.toLocaleString()}</span> total
        </span>

        <div className="flex items-center gap-1">
          <button type="button" onClick={() => goTo(1)} disabled={page === 1 || loading}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#7a7a7a] transition hover:bg-white/[0.06] hover:text-[#d0d0d0] disabled:opacity-30 disabled:cursor-not-allowed">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
            </svg>
          </button>
          <button type="button" onClick={() => goTo(page - 1)} disabled={page === 1 || loading}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#7a7a7a] transition hover:bg-white/[0.06] hover:text-[#d0d0d0] disabled:opacity-30 disabled:cursor-not-allowed">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>

          {/* Page numbers */}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let p: number;
            if (totalPages <= 5) p = i + 1;
            else if (page <= 3) p = i + 1;
            else if (page >= totalPages - 2) p = totalPages - 4 + i;
            else p = page - 2 + i;
            return (
              <button key={p} type="button" onClick={() => goTo(p)} disabled={loading}
                className={`flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-medium transition
                  ${p === page
                    ? "bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/25"
                    : "text-[#7a7a7a] hover:bg-white/[0.06] hover:text-[#d0d0d0]"
                  } disabled:cursor-wait`}>
                {p}
              </button>
            );
          })}

          <button type="button" onClick={() => goTo(page + 1)} disabled={page === totalPages || loading}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#7a7a7a] transition hover:bg-white/[0.06] hover:text-[#d0d0d0] disabled:opacity-30 disabled:cursor-not-allowed">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
          <button type="button" onClick={() => goTo(totalPages)} disabled={page === totalPages || loading}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#7a7a7a] transition hover:bg-white/[0.06] hover:text-[#d0d0d0] disabled:opacity-30 disabled:cursor-not-allowed">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 4.5l7.5 7.5-7.5 7.5m6-15l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
