"use client";

import { CopilotChat } from "@copilotkit/react-ui";
import { useDashboardAction } from "@/components/actions/useDashboardAction";
import { useDashboardStore } from "@/store/dashboard";
import DashboardRenderer from "@/components/DashboardRenderer";
import { PRODUCT_NAME, PRODUCT_TAGLINE, PRODUCT_TAGLINE_LOWER } from "@/lib/brand";
import { SYSTEM_PROMPT } from "@/lib/prompts/system";

export default function AppPage() {
  useDashboardAction();
  const dashboards = useDashboardStore((s) => s.dashboards);
  const clear = useDashboardStore((s) => s.clear);

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      {/* Sidebar chat */}
      <aside className="flex w-[420px] shrink-0 flex-col border-r border-zinc-800 bg-zinc-900/40">
        <header className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">{PRODUCT_NAME}</h1>
            <p className="text-xs text-zinc-500">{PRODUCT_TAGLINE}</p>
          </div>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="rounded-md border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
            >
              Sign out
            </button>
          </form>
        </header>

        <div className="flex-1 overflow-hidden">
          <CopilotChat
            instructions={SYSTEM_PROMPT}
            labels={{
              title: PRODUCT_NAME,
              initial:
                "Ask about your data in plain language—I’ll shape the dashboard to fit that answer, not a generic template.",
              placeholder:
                "e.g. Show me a sales overview for last month…",
            }}
            className="h-full"
          />
        </div>
      </aside>

      {/* Dashboard canvas */}
      <main className="flex-1 overflow-y-auto p-6">
        {dashboards.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/60">
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
              <h2 className="text-lg font-medium text-zinc-300">
                No dashboards yet
              </h2>
              <p className="mt-1 max-w-sm text-sm text-zinc-500">
                Ask in the chat — {PRODUCT_TAGLINE_LOWER}. Each question can
                spawn a new dashboard view.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-200">
                Dashboards
              </h2>
              <button
                onClick={clear}
                className="rounded-md border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
              >
                Clear all
              </button>
            </div>

            {dashboards.map((db, i) => (
              <div
                key={i}
                className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5"
              >
                {db.title && (
                  <h3 className="mb-1 text-lg font-semibold">{db.title}</h3>
                )}
                {db.description && (
                  <p className="mb-4 text-sm text-zinc-400">
                    {db.description}
                  </p>
                )}
                <DashboardRenderer node={db.layout} />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
