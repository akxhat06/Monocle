"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardMain from "@/components/dashboard/DashboardMain";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

const SIDEBAR_COLLAPSED_KEY = "monocle-sidebar-collapsed";

/** Greeting + ~3 words (no product name). */
const ASSISTANT_REST = "Ask me anything";

const PULSE_INTERVAL_MS = 7000;
const PULSE_VISIBLE_MS = 2600;
const COMPOSER_ANIM_MS = 280;

export default function CrmDashboard() {
  /** Replace with real state when a full assistant panel exists. */
  const chatOpen = false;

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [botHover, setBotHover] = useState(false);
  const [pulseOn, setPulseOn] = useState(false);
  const [composerMounted, setComposerMounted] = useState(false);
  const [composerEntered, setComposerEntered] = useState(false);
  const composerInputRef = useRef<HTMLInputElement>(null);
  const composerCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const closeComposer = useCallback(() => {
    setComposerEntered(false);
    if (composerCloseTimerRef.current) clearTimeout(composerCloseTimerRef.current);
    composerCloseTimerRef.current = setTimeout(() => {
      setComposerMounted(false);
      composerCloseTimerRef.current = null;
    }, COMPOSER_ANIM_MS);
  }, []);

  const openComposer = useCallback(() => {
    if (chatOpen) return;
    if (composerCloseTimerRef.current) {
      clearTimeout(composerCloseTimerRef.current);
      composerCloseTimerRef.current = null;
    }
    setComposerEntered(false);
    setComposerMounted(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setComposerEntered(true));
    });
  }, [chatOpen]);

  const toggleComposerFromBot = useCallback(() => {
    if (chatOpen) return;
    if (composerMounted) closeComposer();
    else openComposer();
  }, [chatOpen, composerMounted, closeComposer, openComposer]);

  useEffect(() => {
    if (!composerMounted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeComposer();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [composerMounted, closeComposer]);

  useEffect(() => {
    if (composerMounted && composerEntered) {
      composerInputRef.current?.focus();
    }
  }, [composerMounted, composerEntered]);

  useEffect(() => {
    return () => {
      if (composerCloseTimerRef.current) clearTimeout(composerCloseTimerRef.current);
    };
  }, []);

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

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout> | undefined;

    const pulse = () => {
      setPulseOn(true);
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(() => setPulseOn(false), PULSE_VISIBLE_MS);
    };

    const intervalId = setInterval(pulse, PULSE_INTERVAL_MS);
    const firstId = setTimeout(pulse, PULSE_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
      clearTimeout(firstId);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, []);

  const tipVisible = botHover || pulseOn;

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

      {composerMounted && (
        <>
          <button
            type="button"
            className={`fixed inset-0 z-[48] cursor-default border-0 bg-black/45 p-0 backdrop-blur-[2px] transition-opacity duration-200 ease-out ${
              composerEntered ? "pointer-events-auto" : "pointer-events-none"
            }`}
            style={{ opacity: composerEntered ? 1 : 0 }}
            aria-label="Close assistant"
            onClick={closeComposer}
          />
          <div
            className="pointer-events-none fixed inset-x-0 bottom-8 z-[49] flex justify-center px-4"
            role="presentation"
          >
            <form
              className={`pointer-events-auto flex w-full max-w-xl items-center gap-3 rounded-full border border-zinc-600/70 bg-zinc-900/95 px-4 py-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.55)] ring-1 ring-white/[0.04] backdrop-blur-md transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none ${
                composerEntered
                  ? "translate-y-0 scale-100 opacity-100"
                  : "translate-y-3 scale-[0.98] opacity-0"
              }`}
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
              }}
            >
              <input
                ref={composerInputRef}
                type="text"
                placeholder="Ask me anything..."
                className="min-w-0 flex-1 bg-transparent text-[15px] text-zinc-200 placeholder:text-slate-500/90 outline-none"
                autoComplete="off"
                aria-label="Message assistant"
              />
              <button
                type="submit"
                className="shrink-0 rounded-full p-1.5 text-slate-500 transition-colors hover:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500/50"
                aria-label="Send message"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <path
                    d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </form>
          </div>
        </>
      )}

      {/* Bubble wider than icon; icon stays 7rem; column centered so tail lines up with head. */}
      <div className="pointer-events-none fixed bottom-9 right-9 z-50 flex flex-col items-center" aria-live="polite">
        <button
          type="button"
          className="pointer-events-auto relative flex cursor-pointer flex-col items-center border-0 bg-transparent p-0"
          onMouseEnter={() => setBotHover(true)}
          onMouseLeave={() => setBotHover(false)}
          onClick={toggleComposerFromBot}
          aria-label="Assistant"
          aria-expanded={composerMounted && composerEntered}
        >
          <div
            className={`-mb-[4.25rem] transition duration-300 ease-out ${
              tipVisible
                ? "translate-y-0 scale-100 opacity-100"
                : "pointer-events-none translate-y-1.5 scale-95 opacity-0"
            }`}
            aria-hidden={!tipVisible}
          >
            <div className="relative z-10 w-max max-w-[calc(100vw-2rem)]">
              <div className="rounded-xl border border-emerald-500/30 bg-zinc-950/95 px-2.5 py-1.5 shadow-lg shadow-black/50 ring-1 ring-white/[0.06] backdrop-blur-md">
                <p className="whitespace-nowrap text-center text-[11px] font-semibold leading-tight text-zinc-100">
                  <span className="text-emerald-300">Hey!!</span>{" "}
                  <span className="font-medium text-zinc-200">{ASSISTANT_REST}</span>
                </p>
              </div>
              {/* Tail reaches toward icon — overlaps top of SVG so gap vs white head closes */}
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
            className="relative z-0 h-[7rem] w-[7rem] shrink-0 select-none opacity-95"
            width={180}
            height={180}
            draggable={false}
          />
        </button>
      </div>
    </div>
  );
}
