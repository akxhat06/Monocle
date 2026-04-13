"use client";

import { useCallback, useEffect, useState } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardMain from "@/components/dashboard/DashboardMain";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { useDashboardAction } from "@/components/actions/useDashboardAction";
import MonocleChat from "@/components/copilot/MonocleChat";

const SIDEBAR_COLLAPSED_KEY = "monocle-sidebar-collapsed";
const ASSISTANT_REST = "Ask me anything";

export default function CrmDashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [quickInputOpen, setQuickInputOpen] = useState(false);
  const [quickQuery, setQuickQuery] = useState("");
  const [botHover, setBotHover] = useState(false);
  // When set, MonocleChat will fire this as an initial message on mount
  const [pendingMessage, setPendingMessage] = useState<string | undefined>();

  // Register the render_dashboard generative-UI action (must be inside CopilotKit)
  useDashboardAction();

  useEffect(() => {
    try {
      if (localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1") {
        setSidebarCollapsed(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return (
    <div className="flex h-screen overflow-hidden text-zinc-100">
      <DashboardSidebar
        activeId="overview"
        collapsed={sidebarCollapsed}
        onNavigate={() => {}}
        onToggleCollapse={toggleSidebar}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <DashboardHeader />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <DashboardMain />
        </main>
      </div>

      {/* ── AI Chat Panel ─────────────────────────────────────────────────── */}
      <aside
        className={`relative z-10 h-full shrink-0 border-l border-[color:var(--oa-border-green)] bg-zinc-950/90 backdrop-blur-md transition-all duration-300 ease-out ${
          chatOpen ? "w-[560px]" : "w-0 border-l-0 overflow-hidden"
        }`}
        aria-hidden={!chatOpen}
      >
        {chatOpen && (
          <div className="flex h-full min-h-0 flex-col">
            {/* ── Panel header ─────────────────────────────────────────────── */}
            <div className="flex shrink-0 items-center justify-between border-b border-emerald-500/20 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" aria-hidden />
                <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">Monocle AI</span>
              </div>
              <button
                type="button"
                onClick={() => setChatOpen(false)}
                className="rounded-full border border-white/[0.08] bg-zinc-900/90 p-1.5 text-zinc-500 transition hover:border-emerald-500/35 hover:text-zinc-200"
                aria-label="Close AI assistant"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* ── Custom chat UI (AG-UI / generative-UI enabled) ─────────────── */}
            <div className="flex-1 min-h-0">
              <MonocleChat initialMessage={pendingMessage} />
            </div>
          </div>
        )}
      </aside>

      {/* ── Floating bot button + quick input bar ─────────────────────────── */}
      {!chatOpen && (
        <>
          {quickInputOpen && (
            <button
              type="button"
              className="fixed inset-0 z-[48] cursor-default border-0 bg-black/45 p-0 backdrop-blur-[2px] transition-opacity duration-200 ease-out"
              aria-label="Close assistant input"
              onClick={() => setQuickInputOpen(false)}
            />
          )}
          {quickInputOpen && (
            <div className="pointer-events-none fixed inset-x-0 bottom-8 z-[49] flex justify-center px-4" role="presentation">
              <form
                className="pointer-events-auto flex w-full max-w-xl items-center gap-3 rounded-full border border-emerald-500/30 bg-zinc-950/95 px-4 py-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.55)] ring-1 ring-white/[0.04] backdrop-blur-md"
                onSubmit={(e) => {
                  e.preventDefault();
                  const value = quickQuery.trim();
                  if (!value) return;
                  setQuickQuery("");
                  setQuickInputOpen(false);
                  // Pass the message to MonocleChat as an initialMessage
                  setPendingMessage(value);
                  setChatOpen(true);
                }}
              >
                <input
                  type="text"
                  value={quickQuery}
                  onChange={(e) => setQuickQuery(e.target.value)}
                  placeholder="Ask analytics question..."
                  className="min-w-0 flex-1 bg-transparent text-[15px] text-zinc-200 placeholder:text-slate-500/90 outline-none"
                  autoComplete="off"
                  aria-label="Message assistant"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-full p-1.5 text-slate-500 transition-colors hover:text-slate-300"
                  aria-label="Send message"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </form>
            </div>
          )}
          <div
            className={`pointer-events-none fixed bottom-9 right-9 z-50 transition-opacity duration-150 ${
              quickInputOpen ? "pointer-events-none opacity-0" : "opacity-100"
            }`}
            aria-hidden={quickInputOpen}
          >
            <button
              type="button"
              className="pointer-events-auto relative flex cursor-pointer flex-col items-center border-0 bg-transparent p-0 transition hover:scale-[1.02]"
              onClick={() => setQuickInputOpen((v) => !v)}
              onMouseEnter={() => setBotHover(true)}
              onMouseLeave={() => setBotHover(false)}
              aria-label="Open AI assistant input"
              aria-expanded={quickInputOpen}
            >
              <div
                className={`relative z-20 -mb-[4.25rem] transition duration-300 ease-out ${
                  botHover || quickInputOpen
                    ? "translate-x-3 -translate-y-8 scale-100 opacity-100"
                    : "pointer-events-none translate-x-3 -translate-y-5 scale-95 opacity-0"
                }`}
                aria-hidden={!(botHover || quickInputOpen)}
              >
                <div className="relative w-max max-w-[calc(100vw-2rem)]">
                  <div className="rounded-xl border border-emerald-500/30 bg-zinc-950/95 px-2.5 py-1.5 shadow-lg shadow-black/50 ring-1 ring-white/[0.06] backdrop-blur-md">
                    <p className="whitespace-nowrap text-center text-[11px] font-semibold leading-tight text-zinc-100">
                      <span className="text-emerald-300">Hey!!</span>{" "}
                      <span className="font-medium text-zinc-200">{ASSISTANT_REST}</span>
                    </p>
                  </div>
                  <div
                    className="absolute left-1/2 top-full z-10 -mt-px h-2.5 w-2.5 -translate-x-1/2 rotate-45 border border-emerald-500/30 border-t-0 border-l-0 bg-zinc-950/95"
                    aria-hidden
                  />
                </div>
              </div>
              <img
                src="/ai-chat-analytics.svg"
                alt=""
                aria-hidden
                className="h-[7rem] w-[7rem] shrink-0 select-none opacity-95"
                width={180}
                height={180}
                draggable={false}
              />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
