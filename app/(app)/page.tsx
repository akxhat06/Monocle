"use client";

import { useDashboardAction } from "@/components/actions/useDashboardAction";
import { useDashboardStore } from "@/store/dashboard";
import DashboardRenderer from "@/components/DashboardRenderer";
import { PRODUCT_NAME, PRODUCT_TAGLINE } from "@/lib/brand";

export default function AppPage() {
  useDashboardAction();
  const dashboards = useDashboardStore((s) => s.dashboards);
  const clear = useDashboardStore((s) => s.clear);

  return (
    <div className="flex h-screen flex-col bg-zinc-950 text-zinc-100">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-950/95 px-5 backdrop-blur-md">
        <div className="flex items-baseline gap-2">
          <h1 className="text-base font-semibold tracking-tight text-zinc-100">{PRODUCT_NAME}</h1>
          <span className="hidden sm:inline text-sm text-zinc-500">{PRODUCT_TAGLINE}</span>
        </div>
        <button
          type="button"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800/80 text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800 hover:text-zinc-100"
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
        <aside className="flex w-56 shrink-0 flex-col border-r border-zinc-800 bg-zinc-900/40">
          <nav className="p-3">
            <div
              className="flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2.5 text-sm font-medium text-emerald-100"
              aria-current="page"
            >
              <svg className="h-4 w-4 shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Overview
            </div>
          </nav>

          <div className="min-h-0 flex-1" aria-hidden />

          <div className="border-t border-zinc-800 p-3">
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900/60 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800 hover:text-zinc-100"
              >
                <svg className="h-4 w-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M18 9l3 3m0 0l-3 3m3-3H9" />
                </svg>
                Log out
              </button>
            </form>
          </div>
        </aside>

        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-5xl p-6 lg:p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-100">Overview</h2>
              <p className="mt-1 max-w-xl text-sm text-zinc-500">
                Your workspace at a glance — {PRODUCT_TAGLINE}. Dashboards and metrics you add will show up here.
              </p>
            </div>

            <div className="mb-10 grid gap-3 sm:grid-cols-3">
              {[
                { label: "Active views", value: dashboards.length ? String(dashboards.length) : "—", hint: "On this overview" },
                { label: "Status", value: "Live", hint: "Connected" },
                { label: "Next step", value: "Add data", hint: "Wire your sources" },
              ].map((card) => (
                <div
                  key={card.label}
                  className="rounded-xl border border-zinc-800/90 bg-zinc-900/50 px-4 py-4"
                >
                  <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">{card.label}</p>
                  <p className="mt-2 text-2xl font-semibold tabular-nums text-zinc-100">{card.value}</p>
                  <p className="mt-1 text-xs text-zinc-600">{card.hint}</p>
                </div>
              ))}
            </div>

            {dashboards.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/25 py-16 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/60">
                  <svg
                    className="h-7 w-7 text-zinc-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605"
                    />
                  </svg>
                </div>
                <h3 className="text-base font-medium text-zinc-300">No dashboards yet</h3>
                <p className="mt-2 max-w-sm text-sm text-zinc-500">
                  When you have dashboard views, they will appear in this overview.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Dashboards</h3>
                  <button
                    type="button"
                    onClick={clear}
                    className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
                  >
                    Clear all
                  </button>
                </div>

                {dashboards.map((db, i) => (
                  <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
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
