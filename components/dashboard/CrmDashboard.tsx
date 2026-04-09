"use client";

import { useCallback, useEffect, useState } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardMain from "@/components/dashboard/DashboardMain";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

const SIDEBAR_COLLAPSED_KEY = "monocle-sidebar-collapsed";
const ASSISTANT_REST = "Ask me anything";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  loading?: boolean;
};

export default function CrmDashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [quickInputOpen, setQuickInputOpen] = useState(false);
  const [quickQuery, setQuickQuery] = useState("");
  const [panelInput, setPanelInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [thinking, setThinking] = useState(false);
  const [botHover, setBotHover] = useState(false);

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

  const sendMessage = useCallback(async (text: string) => {
    const value = text.trim();
    if (!value) return;

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: value,
    };
    const loadingMessage: ChatMessage = {
      id: `a-loading-${Date.now()}`,
      role: "assistant",
      content: "",
      loading: true,
    };

    setMessages((prev) => [...prev, userMessage, loadingMessage]);
    setThinking(true);

    // Placeholder async response while backend integration is finalized.
    await new Promise((resolve) => setTimeout(resolve, 1100));

    const reply = `Got it. I am analyzing "${value}" now and preparing insights.`;
    setMessages((prev) =>
      prev.map((m) =>
        m.id === loadingMessage.id
          ? { id: `a-${Date.now()}`, role: "assistant", content: reply, loading: false }
          : m,
      ),
    );
    setThinking(false);
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
      <aside
        className={`relative z-10 h-full shrink-0 border-l border-[color:var(--oa-border-green)] bg-zinc-950/90 backdrop-blur-md transition-all duration-300 ease-out ${
          chatOpen ? "w-[560px]" : "w-0 border-l-0"
        }`}
        aria-hidden={!chatOpen}
      >
        {chatOpen && (
          <div
            className={`flex h-full min-h-0 flex-col transition-all duration-300 ease-out ${
              chatOpen ? "translate-x-0 opacity-100" : "translate-x-5 opacity-0"
            }`}
          >
            <div className="min-h-0 flex-1 overflow-hidden p-4">
              <div
                className="relative flex h-full min-h-0 flex-col rounded-[28px] border border-emerald-500/30 bg-[linear-gradient(165deg,rgba(14,14,16,0.96)_0%,rgba(7,7,9,0.98)_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_0_1px_rgba(0,0,0,0.45),0_0_22px_rgba(74,222,128,0.07)]"
              >
                <button
                  type="button"
                  onClick={() => setChatOpen(false)}
                  className="absolute right-3 top-3 z-20 rounded-full border border-white/[0.08] bg-zinc-900/90 p-2 text-zinc-500 transition hover:border-emerald-500/35 hover:text-zinc-200"
                  aria-label="Close AI assistant"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-white/[0.05] bg-black/20 p-3">
                  {messages.length === 0 ? (
                    <p className="text-sm text-zinc-500">Ask your first analytics question...</p>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((message) =>
                        message.role === "user" ? (
                          <div key={message.id} className="flex w-full justify-end">
                            <div className="flex max-w-[85%] items-start gap-1.5">
                              <div className="w-fit rounded-2xl border border-white/[0.08] bg-white/[0.035] px-3 py-2 text-sm text-zinc-100">
                                {message.content}
                              </div>
                              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-zinc-300">
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.118a7.5 7.5 0 0115 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                </svg>
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div key={message.id} className="flex w-full justify-start">
                            <div className="flex max-w-[88%] items-start gap-2">
                              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
                                <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                                  <path d="M8 1.5l1.3 3.2L12.5 6 9.3 7.3 8 10.5 6.7 7.3 3.5 6l3.2-1.3L8 1.5z" />
                                </svg>
                              </span>
                              <div className="w-fit rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.08] px-3 py-2 text-sm text-zinc-100">
                                {message.loading ? (
                                  <span className="inline-flex items-center gap-1.5 text-zinc-300">
                                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
                                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300 [animation-delay:120ms]" />
                                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300 [animation-delay:240ms]" />
                                  </span>
                                ) : (
                                  message.content
                                )}
                              </div>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </div>
                <form
                  className="mt-3 flex items-center gap-2 rounded-2xl border border-emerald-500/25 bg-zinc-950/80 p-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void sendMessage(panelInput);
                    setPanelInput("");
                  }}
                >
                  <input
                    type="text"
                    value={panelInput}
                    onChange={(e) => setPanelInput(e.target.value)}
                    placeholder="Ask me anything..."
                    className="min-w-0 flex-1 bg-transparent px-2 text-base text-zinc-100 placeholder:text-zinc-500 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={thinking}
                    className="rounded-full p-2 text-zinc-400 transition hover:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Send message"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </aside>
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
                  void sendMessage(value);
                  setQuickQuery("");
                  setQuickInputOpen(false);
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
<<<<<<< HEAD

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
            className={`relative z-20 -mb-[4.25rem] transition duration-300 ease-out ${
              tipVisible
                ? "translate-x-3 -translate-y-8 scale-100 opacity-100"
                : "pointer-events-none translate-x-3 -translate-y-5 scale-95 opacity-0"
            }`}
            aria-hidden={!tipVisible}
          >
            <div className="relative w-max max-w-[calc(100vw-2rem)]">
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
=======
>>>>>>> 31963a2 (Enhance Copilot integration with new UI components and styling)
    </div>
  );
}
