"use client";

import { useCallback, useEffect, useState } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardMain from "@/components/dashboard/DashboardMain";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { useDashboardAction } from "@/components/actions/useDashboardAction";
import MonocleChat from "@/components/copilot/MonocleChat";
import ChatPreviewPanel from "@/components/copilot/ChatPreviewPanel";

const SIDEBAR_COLLAPSED_KEY = "monocle-sidebar-collapsed";

export default function CrmDashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | undefined>();
  const [botHover, setBotHover] = useState(false);

  // Register the render_dashboard generative-UI action (must be inside CopilotKit)
  useDashboardAction();

  useEffect(() => {
    try {
      if (localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1") setSidebarCollapsed(true);
    } catch { /* ignore */ }
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((c) => {
      const next = !c;
      try { localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0"); } catch { /* ignore */ }
      return next;
    });
  }, []);

  // Called when user submits a query from the preview panel
  const handlePreviewSubmit = useCallback((query: string) => {
    setPreviewOpen(false);
    setPendingMessage(query);
    setChatOpen(true);
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

      {/* ── AI Chat Panel ──────────────────────────────────────────────────── */}
      <aside
        className={`relative z-10 h-full shrink-0 border-l border-[color:var(--oa-border-green)] bg-zinc-950/90 backdrop-blur-md transition-all duration-300 ease-out ${
          chatOpen ? "w-[560px]" : "w-0 border-l-0 overflow-hidden"
        }`}
        aria-hidden={!chatOpen}
      >
        {chatOpen && (
          <div className="flex h-full min-h-0 flex-col">
            {/* Panel header */}
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

            {/* Chat UI */}
            <div className="flex-1 min-h-0">
              <MonocleChat
                initialMessage={pendingMessage}
                onReady={() => setPendingMessage(undefined)}
              />
            </div>
          </div>
        )}
      </aside>

      {/* ── Preview panel (blurred backdrop + AGUI preview) ──────────────── */}
      {!chatOpen && previewOpen && (
        <ChatPreviewPanel
          onClose={() => setPreviewOpen(false)}
          onSubmit={handlePreviewSubmit}
        />
      )}

      {/* ── Floating bot button ────────────────────────────────────────────── */}
      {!chatOpen && (
        <div
          className={`pointer-events-none fixed bottom-9 right-9 z-50 transition-opacity duration-150 ${
            previewOpen ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
          aria-hidden={previewOpen}
        >
          <button
            type="button"
            className="pointer-events-auto relative flex cursor-pointer flex-col items-center border-0 bg-transparent p-0 transition hover:scale-[1.02]"
            onClick={() => setPreviewOpen(true)}
            onMouseEnter={() => setBotHover(true)}
            onMouseLeave={() => setBotHover(false)}
            aria-label="Open AI assistant"
          >
            {/* Tooltip */}
            <div
              className={`relative z-20 -mb-[4.25rem] transition duration-300 ease-out ${
                botHover
                  ? "translate-x-3 -translate-y-8 scale-100 opacity-100"
                  : "pointer-events-none translate-x-3 -translate-y-5 scale-95 opacity-0"
              }`}
              aria-hidden={!botHover}
            >
              <div className="relative w-max max-w-[calc(100vw-2rem)]">
                <div className="rounded-xl border border-emerald-500/30 bg-zinc-950/95 px-2.5 py-1.5 shadow-lg shadow-black/50 ring-1 ring-white/[0.06] backdrop-blur-md">
                  <p className="whitespace-nowrap text-center text-[11px] font-semibold leading-tight text-zinc-100">
                    <span className="text-emerald-300">Hey!!</span>{" "}
                    <span className="font-medium text-zinc-200">Ask me anything</span>
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
      )}
    </div>
  );
}
