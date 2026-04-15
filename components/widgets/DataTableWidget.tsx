"use client";

import { useState } from "react";

const DEFAULT_PAGE_SIZE = 10;

export default function DataTableWidget({
  title,
  columns,
  rows,
  pageSize = DEFAULT_PAGE_SIZE,
}: {
  title?: string;
  columns: string[];
  rows: Array<Record<string, unknown>>;
  pageSize?: number;
}) {
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const pageRows = rows.slice(page * pageSize, (page + 1) * pageSize);
  const hasPrev = page > 0;
  const hasNext = page < totalPages - 1;

  return (
    <div className="overflow-hidden rounded-lg border border-white/[0.07] bg-[#1c1c1c]">
      {title ? (
        <h3 className="border-b border-white/[0.06] px-4 py-3 text-sm font-medium text-[#c0c0c0]">
          {title}
        </h3>
      ) : null}

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] text-[#5a5a5a]">
              {columns.map((column) => (
                <th
                  key={column}
                  className="px-4 py-2 font-medium uppercase tracking-wider text-[10px]"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, index) => (
              <tr
                key={index}
                className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
              >
                {columns.map((column) => (
                  <td key={column} className="px-4 py-2.5 text-[#c0c0c0] max-w-[260px] truncate">
                    {String(row[column] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination footer — only shown when there is more than one page */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-2.5">
          <span className="text-[11px] text-[#5a5a5a]">
            {page * pageSize + 1}–{Math.min((page + 1) * pageSize, rows.length)}{" "}
            of {rows.length} rows
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => p - 1)}
              disabled={!hasPrev}
              className="rounded-md border border-white/[0.07] bg-white/[0.03] px-2.5 py-1 text-[11px] text-[#7a7a7a] transition hover:bg-white/[0.06] hover:text-[#c0c0c0] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Prev
            </button>
            <span className="px-2 text-[11px] text-[#4a4a4a]">
              {page + 1} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasNext}
              className="rounded-md border border-white/[0.07] bg-white/[0.03] px-2.5 py-1 text-[11px] text-[#7a7a7a] transition hover:bg-white/[0.06] hover:text-[#c0c0c0] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
