"use client";

import { DM_Sans } from "next/font/google";
import MonocleMarkAnimated from "@/components/brand/MonocleMarkAnimated";
import OverviewStats from "@/components/app/OverviewStats";
import { useDashboardAction } from "@/components/actions/useDashboardAction";
import { useDashboardStore } from "@/store/dashboard";
import DashboardRenderer from "@/components/DashboardRenderer";
import { PRODUCT_NAME, PRODUCT_TAGLINE } from "@/lib/brand";

const fontSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export default function AppPage() {
  useDashboardAction();
  const dashboards = useDashboardStore((s) => s.dashboards);
  const clear = useDashboardStore((s) => s.clear);

  return (
    <div
      className={`${fontSans.className} flex h-screen flex-col overflow-hidden bg-[#09090b] text-zinc-100`}
      style={{
        backgroundImage:
          "radial-gradient(120% 100% at 50% 0%, #0f1218 0%, #09090b 45%, #050506 100%)",
      }}
    >
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-emerald-500/15 bg-[#09090b]/90 px-5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 shrink-0 overflow-hidden rounded-lg" aria-hidden>
            <MonocleMarkAnimated size={32} />
          </div>
          <div className="flex items-baseline gap-2">
            <h1 className="text-base font-semibold tracking-tight text-zinc-100">{PRODUCT_NAME}</h1>
            <span className="hidden text-sm text-zinc-500 sm:inline">{PRODUCT_TAGLINE}</span>
          </div>
        </div>
        <button
          type="button"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/[0.1] bg-zinc-900/80 text-zinc-300 transition hover:border-emerald-500/35 hover:text-emerald-100"
          aria-label="Profile"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
            />
          </svg>
        </button>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="flex min-h-0 w-60 shrink-0 flex-col self-stretch overflow-hidden border-r border-emerald-500/20 bg-zinc-950">
          <div className="shrink-0 border-b border-zinc-800 p-4">
            <div className="flex items-center gap-3">
              <MonocleMarkAnimated size={36} title="Monocle" />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold tracking-tight text-zinc-100">{PRODUCT_NAME}</p>
                <p className="truncate text-[10px] font-medium text-emerald-400/90">{PRODUCT_TAGLINE}</p>
              </div>
            </div>
          </div>

          <nav className="shrink-0 p-3">
            <div
              className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm font-semibold text-emerald-50"
              aria-current="page"
            >
              <svg width={16} height={16} className="shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
              Overview
            </div>
          </nav>

          <div className="min-h-0 flex-1 overflow-y-auto" aria-hidden />

          <div className="shrink-0 border-t border-zinc-800 bg-zinc-950 p-3">
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 py-2.5 text-sm font-semibold text-zinc-200 transition hover:border-red-500/40 hover:bg-red-950/30 hover:text-red-200"
              >
                <svg className="h-4 w-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M18 9l3 3m0 0l-3 3m3-3H9"
                  />
                </svg>
                Log out
              </button>
            </form>
          </div>
        </aside>

        <main className="relative min-h-0 flex-1 overflow-y-auto">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.2]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(74, 222, 128, 0.06) 1px, transparent 1px),
                linear-gradient(90deg, rgba(74, 222, 128, 0.06) 1px, transparent 1px)
              `,
              backgroundSize: "48px 48px",
              maskImage: "linear-gradient(180deg, transparent 0%, black 12%, black 88%, transparent 100%)",
            }}
            aria-hidden
          />
          <div className="relative z-[1] mx-auto max-w-6xl px-5 py-8 lg:px-8 lg:py-10">
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-zinc-50">Overview</h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-500">
                Analytics from your Supabase workspace — filtered by date. Counts reflect rows in{" "}
                <span className="font-medium text-zinc-400">users</span>,{" "}
                <span className="font-medium text-zinc-400">sessions</span>,{" "}
                <span className="font-medium text-zinc-400">questions</span>,{" "}
                <span className="font-medium text-zinc-400">errors</span>,{" "}
                <span className="font-medium text-zinc-400">asr_logs</span>,{" "}
                <span className="font-medium text-zinc-400">tts_logs</span>, and{" "}
                <span className="font-medium text-zinc-400">tool_calls</span>.
              </p>
            </div>

            <OverviewStats />

            {dashboards.length > 0 && (
              <div className="mt-12 flex flex-col gap-6">
                <div className="flex items-center justify-between border-t border-white/[0.06] pt-10">
                  <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">Copilot dashboards</h3>
                  <button
                    type="button"
                    onClick={clear}
                    className="rounded-lg border border-white/[0.1] bg-black/30 px-3 py-1.5 text-xs font-semibold text-zinc-400 transition hover:border-emerald-500/30 hover:text-emerald-200"
                  >
                    Clear all
                  </button>
                </div>

                {dashboards.map((db, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-white/[0.08] bg-[linear-gradient(165deg,rgba(28,28,31,0.85)_0%,rgba(14,14,16,0.92)_100%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                  >
                    {db.title && <h4 className="mb-1 text-lg font-semibold text-zinc-100">{db.title}</h4>}
                    {db.description && <p className="mb-4 text-sm text-zinc-400">{db.description}</p>}
                    <DashboardRenderer node={db.layout} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
