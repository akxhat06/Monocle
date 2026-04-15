"use client";

import { useCallback, useEffect, useState } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardMain from "@/components/dashboard/DashboardMain";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import AnalyticsPage from "@/components/dashboard/AnalyticsPage";
import PlatformPage from "@/components/dashboard/PlatformPage";
import { useDashboardAction } from "@/components/actions/useDashboardAction";
import MonocleChat from "@/components/copilot/MonocleChat";
import ErrorsPage from "@/components/dashboard/ErrorsPage";
import { useSound } from "@/lib/hooks/useSound";

const SIDEBAR_COLLAPSED_KEY = "monocle-sidebar-collapsed";

export default function CrmDashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState("overview");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatFullscreen, setChatFullscreen] = useState(false);
  const [botHover, setBotHover] = useState(false);

  const { play } = useSound();

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

  return (
    <div className="flex h-screen overflow-hidden text-zinc-100">
      <DashboardSidebar
        activeId={activeNav}
        collapsed={sidebarCollapsed}
        onNavigate={setActiveNav}
        onToggleCollapse={toggleSidebar}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <DashboardHeader />
        <main className="min-h-0 flex-1 overflow-y-auto">
          {activeNav === "overview"   && <DashboardMain />}
          {(activeNav === "calls" || activeNav === "questions") && <AnalyticsPage tab={activeNav} />}
          {activeNav === "errors"     && <ErrorsPage />}
          {(activeNav === "asr" || activeNav === "tts") && <PlatformPage tab={activeNav} />}
        </main>
      </div>

      {/*
        ── AI Chat Panel ───────────────────────────────────────────────────
        Always mounted so MonocleChat never loses its state.
        - hidden (w-0 / invisible) when chatOpen=false
        - side drawer (w-[540px]) when chatOpen && !chatFullscreen
        - fixed fullscreen overlay when chatOpen && chatFullscreen
      */}
      <div
        className={`flex flex-col bg-[#161616] transition-all duration-300 ease-out ${
          !chatOpen
            ? "w-0 overflow-hidden invisible"
            : chatFullscreen
              ? "fixed inset-0 z-50"
              : "relative z-10 h-full w-[540px] shrink-0 border-l border-white/[0.06]"
        }`}
        aria-hidden={!chatOpen}
      >
        {/* Panel header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.5)]" aria-hidden />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[#6b6b6b]">Monocle AI</span>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Expand / Collapse button */}
            <button
              type="button"
              onClick={() => { play(chatFullscreen ? "toggle-off" : "toggle-on"); setChatFullscreen((f) => !f); }}
              className="rounded-lg border border-white/[0.07] bg-white/[0.04] p-1.5 text-[#6b6b6b] transition hover:bg-white/[0.08] hover:text-[#c0c0c0]"
              aria-label={chatFullscreen ? "Exit full screen" : "Expand to full screen"}
            >
              {chatFullscreen ? (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 9L4 4m0 0h5m-5 0v5M15 9l5-5m0 0h-5m5 0v5M9 15l-5 5m0 0h5m-5 0v-5M15 15l5 5m0 0h-5m5 0v-5" />
                </svg>
              ) : (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5M20 8V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5M20 16v4m0 0h-4m4 0l-5-5" />
                </svg>
              )}
            </button>
            {/* Close button */}
            <button
              type="button"
              onClick={() => { play("toggle-off"); setChatOpen(false); setChatFullscreen(false); }}
              className="rounded-lg border border-white/[0.07] bg-white/[0.04] p-1.5 text-[#6b6b6b] transition hover:bg-white/[0.08] hover:text-[#c0c0c0]"
              aria-label="Close AI assistant"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Chat UI — single instance, never unmounts */}
        <div className="flex-1 min-h-0">
          <MonocleChat isFullscreen={chatFullscreen} />
        </div>
      </div>

      {/* ── Floating bot button ────────────────────────────────────────────── */}
      {!chatOpen && (
        <div className="pointer-events-none fixed bottom-8 right-8 z-30">
          <button
            type="button"
            className="pointer-events-auto relative flex cursor-pointer flex-col items-center border-0 bg-transparent p-0 transition hover:scale-[1.03]"
            onClick={() => { play("toggle-on"); setChatOpen(true); }}
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
                <div className="rounded-xl border border-white/[0.1] bg-[#1f1f1f] px-3 py-1.5 shadow-xl shadow-black/40 backdrop-blur-md">
                  <p className="whitespace-nowrap text-center text-[11px] font-medium leading-tight text-[#c0c0c0]">
                    <span className="text-violet-400">Hey!</span>{" "}
                    Ask me anything
                  </p>
                </div>
                <div
                  className="absolute left-1/2 top-full z-10 -mt-px h-2.5 w-2.5 -translate-x-1/2 rotate-45 border border-white/[0.1] border-t-0 border-l-0 bg-[#1f1f1f]"
                  aria-hidden
                />
              </div>
            </div>

            <img
              src="/ai-chat-analytics.svg"
              alt=""
              aria-hidden
              className="h-[8rem] w-[8rem] shrink-0 select-none"
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
