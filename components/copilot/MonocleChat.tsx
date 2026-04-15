"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useCopilotChatInternal, useCopilotAdditionalInstructions } from "@copilotkit/react-core";
import { SYSTEM_PROMPT } from "@/lib/prompts/system";

import MonocleMarkAnimated from "@/components/brand/MonocleMarkAnimated";
import DashboardRenderer from "@/components/DashboardRenderer";
import DashboardSkeleton from "@/components/DashboardSkeleton";
import { DashboardSchema } from "@/lib/schemas/dashboard";
import { useNotificationStore } from "@/store/notifications";
import { useSound } from "@/lib/hooks/useSound";

// ── Types ─────────────────────────────────────────────────────────────────────

type ToolCall = {
  id: string;
  type?: string;
  function?: { name?: string; arguments?: string };
};

type AnyMessage = {
  id: string;
  role: string;
  content: unknown;
  // AG-UI: assistant messages carry toolCalls[]
  toolCalls?: ToolCall[];
  // tool result messages
  toolCallId?: string;
  toolCallName?: string;
  name?: string;
  // CopilotKit generativeUI (only works for toolCalls[0] — we bypass this)
  generativeUI?: () => React.ReactNode;
  generativeUIPosition?: "before" | "after";
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Scans all messages for a render_dashboard tool call and its result.
 * useLazyToolRenderer only looks at toolCalls[0], so render_dashboard (which
 * is typically toolCalls[N] where N>0) never gets a generativeUI renderer.
 * We bypass that entirely and handle it ourselves.
 */
function extractDashboardRender(msgs: AnyMessage[]): React.ReactNode | null {
  // Find the assistant message that has a render_dashboard tool call
  for (const msg of msgs) {
    if (msg.role !== "assistant" || !Array.isArray(msg.toolCalls)) continue;
    for (const tc of msg.toolCalls) {
      if (tc.function?.name !== "render_dashboard") continue;
      // Found the render_dashboard tool call — look for its result
      const resultMsg = msgs.find(
        (m) => m.role === "tool" && m.toolCallId === tc.id,
      );
      const argsRaw = tc.function?.arguments ?? "{}";
      let args: Record<string, unknown> = {};
      try { args = JSON.parse(argsRaw); } catch { /* incomplete stream */ }
      const dashboardRaw = args.dashboard;
      if (!dashboardRaw && !resultMsg) {
        // Tool call is streaming but not yet complete — show skeleton
        return <DashboardSkeleton />;
      }
      if (!dashboardRaw) return null;
      const parsed = DashboardSchema.safeParse(dashboardRaw);
      if (!parsed.success) {
        console.error("[MonocleChat] Dashboard parse failed:", parsed.error.format());
        return (
          <div className="rounded-lg border border-amber-800/60 bg-amber-950/30 p-3 text-xs text-amber-300/80">
            <p className="font-semibold mb-1">Dashboard schema mismatch</p>
            <pre className="whitespace-pre-wrap opacity-70 text-[10px]">
              {parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n")}
            </pre>
          </div>
        );
      }
      return (
        <div className="my-1">
          {parsed.data.title && (
            <h3 className="mb-1 text-sm font-semibold text-zinc-100">{parsed.data.title}</h3>
          )}
          {parsed.data.description && (
            <p className="mb-3 text-xs text-zinc-400">{parsed.data.description}</p>
          )}
          <DashboardRenderer node={parsed.data.layout} />
        </div>
      );
    }
  }
  return null;
}


function extractText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((c: unknown) => {
        const part = c as Record<string, unknown>;
        return part.type === "text" ? String(part.text ?? "") : "";
      })
      .join("");
  }
  return "";
}

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  return lines.map((line, li) => {
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
    let last = 0;
    let match: RegExpExecArray | null;
    let key = 0;
    while ((match = regex.exec(line)) !== null) {
      if (match.index > last) parts.push(line.slice(last, match.index));
      const raw = match[0];
      if (raw.startsWith("**")) {
        parts.push(<strong key={key++} className="font-semibold text-zinc-200">{raw.slice(2, -2)}</strong>);
      } else {
        parts.push(<code key={key++} className="rounded bg-zinc-800 px-1 py-0.5 font-mono text-xs text-emerald-300">{raw.slice(1, -1)}</code>);
      }
      last = match.index + raw.length;
    }
    if (last < line.length) parts.push(line.slice(last));
    return (
      <span key={li}>
        {parts}
        {li < lines.length - 1 && <br />}
      </span>
    );
  });
}

// ── Step parser ───────────────────────────────────────────────────────────────
// Scans the raw CopilotKit message list for tool-call activity and builds a
// human-readable stepper to show while the AI is working.

type Step = {
  id: string;
  label: string;
  status: "running" | "done";
};

function buildSteps(msgs: AnyMessage[]): Step[] {
  const steps: Step[] = [];
  const resultIds = new Set<string>();

  // Collect all tool result IDs first so we know which calls are done
  for (const m of msgs) {
    if (m.role === "tool" && m.toolCallId) resultIds.add(m.toolCallId);
    // AG-UI also emits role="tool" with id matching toolCallId
    if (m.role === "tool") {
      const id = (m as Record<string, unknown>).toolCallId as string | undefined
        ?? (m as Record<string, unknown>).id as string | undefined;
      if (id) resultIds.add(id);
    }
  }

  let queryCount = 0;

  for (const m of msgs) {
    // assistant messages carry toolCalls array in some CopilotKit versions
    const toolCalls = (m as Record<string, unknown>).toolCalls as Array<{
      id: string;
      function?: { name?: string };
    }> | undefined;

    if (Array.isArray(toolCalls)) {
      for (const tc of toolCalls) {
        const name = tc.function?.name ?? "";
        if (name === "run_analytics_query") {
          queryCount++;
          steps.push({
            id: tc.id,
            label: `Querying database (${queryCount})`,
            status: resultIds.has(tc.id) ? "done" : "running",
          });
        } else if (name === "render_dashboard") {
          steps.push({
            id: tc.id,
            label: "Building dashboard",
            status: resultIds.has(tc.id) ? "done" : "running",
          });
        }
      }
    }

    // Fallback: some CopilotKit versions emit separate messages with role "tool_call"
    // or assistant messages with toolCallName set directly
    if (m.role === "assistant" && m.toolCallName) {
      const name = m.toolCallName;
      const id = m.toolCallId ?? m.id;
      if (name === "run_analytics_query") {
        queryCount++;
        steps.push({
          id,
          label: `Querying database (${queryCount})`,
          status: resultIds.has(id) ? "done" : "running",
        });
      } else if (name === "render_dashboard") {
        steps.push({
          id,
          label: "Building dashboard",
          status: resultIds.has(id) ? "done" : "running",
        });
      }
    }
  }

  return steps;
}

// ── Suggestion Carousel ───────────────────────────────────────────────────────

function SuggestionCarousel({
  suggestions,
  onSelect,
}: {
  suggestions: { label: string; prompt: string }[];
  onSelect: (prompt: string) => void;
}) {
  const n = suggestions.length;
  const [current, setCurrent] = useState(0);
  // Track direction: +1 = forward (slide left), -1 = backward (slide right)
  const dirRef = useRef(1);

  const advance = useCallback((next: number) => {
    // Compute shortest circular direction
    const diff = ((next - current) + n) % n;
    dirRef.current = diff <= n / 2 ? 1 : -1;
    setCurrent(next);
  }, [current, n]);

  // Auto-advance every 3s — always forward, wraps around seamlessly
  useEffect(() => {
    const id = setInterval(() => {
      dirRef.current = 1;
      setCurrent((c) => (c + 1) % n);
    }, 3000);
    return () => clearInterval(id);
  }, [n]);

  return (
    <div className="shrink-0 flex flex-col items-center gap-1.5 px-3 py-2 border-t border-white/[0.04]">
      <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#5a5a5a]">Try asking</p>
      <div className="relative flex items-center justify-center w-full overflow-hidden" style={{ height: 34 }}>
        {suggestions.map((s, i) => {
          // Circular distance from current
          const rawOffset = i - current;
          // Normalize to [-floor(n/2), ceil(n/2)]
          const offset = rawOffset > n / 2
            ? rawOffset - n
            : rawOffset < -n / 2
              ? rawOffset + n
              : rawOffset;

          const isActive = offset === 0;
          const isAdjacent = Math.abs(offset) === 1;
          if (!isActive && !isAdjacent) return null;

          // Translate: active=center, next=right, prev=left
          const tx = offset === 0 ? "0%" : offset > 0 ? "115%" : "-115%";

          return (
            <button
              key={s.prompt}
              type="button"
              onClick={() => isActive ? onSelect(s.prompt) : advance(i)}
              tabIndex={isActive ? 0 : -1}
              className={`absolute transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[11px] leading-none whitespace-nowrap select-none
                ${isActive
                  ? "border-violet-500/30 bg-violet-500/10 text-white z-10"
                  : "border-white/[0.05] bg-white/[0.02] text-[#4a4a4a] z-0 cursor-pointer"
                }`}
              style={{
                transform: `translateX(${tx}) scale(${isActive ? 1 : 0.88})`,
                opacity: isActive ? 1 : 0.25,
              }}
            >
              <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${isActive ? "bg-violet-400" : "bg-white/15"}`} aria-hidden />
              {s.label}
            </button>
          );
        })}
      </div>
      {/* Dots */}
      <div className="flex items-center gap-1">
        {suggestions.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => advance(i)}
            aria-label={`Suggestion ${i + 1}`}
            className={`rounded-full transition-all duration-300 ${
              i === current ? "bg-violet-400 w-3 h-1" : "bg-white/[0.12] w-1 h-1 hover:bg-white/25"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function AgentStepper({ steps, isLoading }: { steps: Step[]; isLoading: boolean }) {
  if (steps.length === 0 && !isLoading) return null;

  // When no steps yet, show a thinking pulse
  if (steps.length === 0 && isLoading) {
    return (
      <div className="flex items-center gap-2 px-1">
        <span className="text-[11px] text-[#7a7a7a]">Thinking</span>
        <span className="flex items-center gap-[3px]">
          {[0,1,2,3].map(i => (
            <span key={i} className="inline-block w-1 rounded-full bg-violet-400"
              style={{
                height: 12,
                animation: "agentBar 1s ease-in-out infinite",
                animationDelay: `${i * 0.15}s`,
              }} />
          ))}
        </span>
        <style>{`
          @keyframes agentBar {
            0%,100% { transform: scaleY(0.4); opacity:0.4; }
            50%      { transform: scaleY(1);   opacity:1;   }
          }
        `}</style>
      </div>
    );
  }

  // While still loading but all steps show "done" = gap between AI turns.
  // Force the last step to keep animating so there's no visual pause.
  const hasRunning = steps.some(s => s.status === "running");
  const allDoneButLoading = isLoading && steps.length > 0 && !hasRunning;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {steps.map((step, i) => {
        const isDone = step.status === "done";
        // Force last chip to animate during inter-step gap
        const forceRunning = allDoneButLoading && i === steps.length - 1;
        const isRunning = step.status === "running" || forceRunning;
        const showDone = isDone && !forceRunning;

        const short = step.label.startsWith("Querying")
          ? `Query ${i + 1}`
          : "Dashboard";

        return (
          <div
            key={step.id ?? i}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium border transition-all duration-300
              ${showDone
                ? "border-violet-500/25 bg-violet-500/10 text-violet-300"
                : isRunning
                  ? "border-violet-400/40 bg-violet-400/10 text-violet-200"
                  : "border-white/[0.07] bg-white/[0.03] text-[#6a6a6a]"
              }`}
          >
            {showDone ? (
              <svg className="h-3 w-3 shrink-0" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path d="M2 6.5l2.5 2.5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : isRunning ? (
              <span className="flex items-center gap-[2px] shrink-0">
                {[0,1,2].map(j => (
                  <span key={j} className="inline-block w-[3px] rounded-full bg-violet-300"
                    style={{
                      height: 10,
                      animation: "agentBar 0.9s ease-in-out infinite",
                      animationDelay: `${j * 0.18}s`,
                    }} />
                ))}
              </span>
            ) : null}
            {short}
          </div>
        );
      })}

      <style>{`
        @keyframes agentBar {
          0%,100% { transform: scaleY(0.35); opacity:0.5; }
          50%      { transform: scaleY(1);    opacity:1;   }
        }
      `}</style>
    </div>
  );
}

// ── Predefined suggestion prompts ─────────────────────────────────────────────

const SUGGESTIONS = [
  { label: "Give me a platform overview", prompt: "Give me a platform overview with KPIs, call trends, and questions by channel" },
  { label: "How are calls trending this week?", prompt: "Show me how calls are trending this week vs last week" },
  { label: "What is the ASR success rate?", prompt: "Show me the ASR success rate and average latency over time" },
  { label: "Show errors by type this week", prompt: "What are the most common errors this week?" },
];

// ── Main component ────────────────────────────────────────────────────────────

export default function MonocleChat({ isFullscreen = false }: { isFullscreen?: boolean }) {
  useCopilotAdditionalInstructions({ instructions: SYSTEM_PROMPT }, []);

  const addNotification = useNotificationStore((s) => s.add);
  const { play, startThinking, stopThinking } = useSound();

  const { messages, sendMessage, isLoading, stopGeneration } =
    useCopilotChatInternal();

  const [input, setInput] = useState("");
  const [pendingUserMsg, setPendingUserMsg] = useState<string | null>(null);

  // ── Per-turn snapshot ─────────────────────────────────────────────────────
  // Each completed AI turn is snapshotted here so it persists when Q2 starts.
  type Turn = { key: string; userMsg: string; dashboard: React.ReactNode | null; text: string };
  const [completedTurns, setCompletedTurns] = useState<Turn[]>([]);
  const currentUserMsgRef = useRef<string>("");
  const prevIsLoadingRef = useRef(false);

  // Sound effects tied to loading state
  useEffect(() => {
    if (!prevIsLoadingRef.current && isLoading) {
      startThinking();
    } else if (prevIsLoadingRef.current && !isLoading) {
      stopThinking();
      play("complete");
    }
  }, [isLoading, startThinking, stopThinking, play]);

  // When loading finishes, snapshot the just-completed turn
  useEffect(() => {
    const allMsgsNow = messages as unknown as AnyMessage[];
    if (prevIsLoadingRef.current && !isLoading) {
      // Find the LAST render_dashboard and the LAST assistant text in this session
      let latestDashboard: React.ReactNode | null = null;
      let latestText = "";

      // Walk messages in reverse to find latest assistant text
      for (let i = allMsgsNow.length - 1; i >= 0; i--) {
        const m = allMsgsNow[i];
        if (m.role === "user") break; // stop at previous user msg
        if (m.role === "assistant" && !latestText) {
          const t = extractText(m.content).trim();
          if (t) latestText = t;
        }
      }

      // Extract dashboard only from messages AFTER the last user message
      const lastUserIdx = [...allMsgsNow].map((m,i) => m.role === "user" ? i : -1).filter(i => i >= 0).pop() ?? -1;
      const currentTurnMsgs = allMsgsNow.slice(lastUserIdx);
      latestDashboard = extractDashboardRender(currentTurnMsgs);

      const userMsg = currentUserMsgRef.current;
      if (userMsg) {
        setCompletedTurns(prev => [...prev, {
          key: `turn-${Date.now()}`,
          userMsg,
          dashboard: latestDashboard,
          text: latestText,
        }]);
        addNotification({
          question: userMsg,
          answer: latestText,
          hasDashboard: latestDashboard !== null,
        });
        currentUserMsgRef.current = "";
      }
    }
    prevIsLoadingRef.current = isLoading;
  }, [isLoading, messages]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    if (!input) { ta.style.height = "20px"; return; }
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 60)}px`;
  }, [input]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [completedTurns, isLoading, pendingUserMsg]);

  const sendingRef = useRef(false);

  const submit = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sendingRef.current) return;
      sendingRef.current = true;
      play("send");
      setInput("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      currentUserMsgRef.current = trimmed;
      setPendingUserMsg(trimmed);
      try {
        await sendMessage({ id: `user-${Date.now()}`, role: "user", content: trimmed });
      } catch (err) {
        console.error("[MonocleChat] sendMessage error:", err);
      } finally {
        sendingRef.current = false;
      }
    },
    [sendMessage],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        void submit(input);
      }
    },
    [input, submit],
  );

  const allMsgs = messages as unknown as AnyMessage[];

  // ── Stepper scoped to current turn only ───────────────────────────────────
  // Find messages after the last user message (current turn only)
  const lastUserIdx = [...allMsgs].map((m, i) => m.role === "user" ? i : -1).filter(i => i >= 0).pop() ?? -1;
  const currentTurnMsgs = lastUserIdx >= 0 ? allMsgs.slice(lastUserIdx) : allMsgs;

  const [steps, setSteps] = useState<Step[]>([]);

  useEffect(() => {
    const fresh = buildSteps(currentTurnMsgs);
    if (!isLoading) { return; }
    setSteps(prev => {
      if (fresh.length === 0) return prev;
      if (fresh.length < prev.length) return prev;
      return fresh.map((s, i) => {
        const p = prev[i];
        if (p?.status === "done" && s.status === "running") return p;
        return s;
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allMsgs, isLoading]);

  // Reset steps when a new message is submitted
  useEffect(() => {
    if (pendingUserMsg) setSteps([]);
  }, [pendingUserMsg]);

  // Clear pending bubble only after the turn is fully snapshotted into completedTurns
  useEffect(() => {
    if (!isLoading && completedTurns.length > 0) {
      setPendingUserMsg(null);
    }
  }, [isLoading, completedTurns.length]);

  const showStepper = isLoading;
  const showEmptyState = completedTurns.length === 0 && !pendingUserMsg && !isLoading;

  // In fullscreen, all content is centered in a max-width column
  const fsCol = isFullscreen ? "w-full max-w-3xl mx-auto" : "";

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* ── Message list ─────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto scroll-smooth">
        <div className={`${fsCol} px-4 py-4 space-y-3`}>

          {/* ── Empty state ──────────────────────────────────────────────── */}
          {showEmptyState && (
            <div className={`flex flex-col pb-2 ${isFullscreen ? "gap-8 pt-12 items-center" : "gap-5 pt-2"}`}>

              {/* Brand + headline */}
              <div className={`flex flex-col items-center gap-4 ${isFullscreen ? "pt-4" : "pt-2"}`}>
                <MonocleMarkAnimated size={isFullscreen ? 64 : 44} title="Monocle AI" />
                <div className="text-center">
                  <p className={`font-semibold text-[#e0e0e0] leading-snug ${isFullscreen ? "text-xl" : "text-sm"}`}>Monocle AI</p>
                  <p className={`mt-1.5 text-[#c0c0c0] leading-relaxed ${isFullscreen ? "text-sm max-w-md" : "text-[11px] max-w-[220px]"}`}>
                    Ask questions in plain language — I&apos;ll query your data and build a live dashboard instantly.
                  </p>
                </div>
              </div>

              {/* What I can do */}
              <div className={`flex flex-col gap-2 ${isFullscreen ? "w-full" : ""}`}>
                <p className={`font-semibold uppercase tracking-[0.14em] text-[#b0b0b0] px-0.5 ${isFullscreen ? "text-[10px] text-center mb-1" : "text-[9px]"}`}>What I can do</p>
                <div className={isFullscreen ? "grid grid-cols-2 gap-3" : "flex flex-col gap-2"}>
                  {[
                    {
                      icon: (
                        <svg className={isFullscreen ? "h-5 w-5" : "h-3.5 w-3.5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                        </svg>
                      ),
                      title: "Build live dashboards",
                      desc: "Charts, KPIs, and tables generated from your real data",
                    },
                    {
                      icon: (
                        <svg className={isFullscreen ? "h-5 w-5" : "h-3.5 w-3.5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 2.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                        </svg>
                      ),
                      title: "Query any metric",
                      desc: "Calls, questions, ASR/TTS latency, errors, user trends",
                    },
                    {
                      icon: (
                        <svg className={isFullscreen ? "h-5 w-5" : "h-3.5 w-3.5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
                        </svg>
                      ),
                      title: "Filter by date range",
                      desc: "Compare this week vs last week, month-over-month, custom ranges",
                    },
                    {
                      icon: (
                        <svg className={isFullscreen ? "h-5 w-5" : "h-3.5 w-3.5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                        </svg>
                      ),
                      title: "Natural language",
                      desc: "No SQL needed — just ask like you&apos;re talking to an analyst",
                    },
                  ].map((item) => (
                    <div key={item.title} className={`flex items-start gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] ${isFullscreen ? "px-4 py-3.5" : "px-3 py-2.5"}`}>
                      <span className={`shrink-0 text-violet-400 ${isFullscreen ? "mt-0.5" : "mt-0.5"}`}>{item.icon}</span>
                      <div className="min-w-0">
                        <p className={`font-medium text-[#d0d0d0] leading-tight ${isFullscreen ? "text-sm" : "text-[11px]"}`}>{item.title}</p>
                        <p className={`mt-0.5 text-[#888] leading-snug ${isFullscreen ? "text-xs" : "text-[10px]"}`}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ── Completed turns — each persists permanently ───────────────── */}
          {completedTurns.map((turn) => (
            <div key={turn.key} className="flex flex-col gap-2">
              {/* User bubble */}
              <div className="flex justify-end">
                <div className={`rounded-2xl rounded-br-sm bg-[#2a2a2a] px-3.5 py-2.5 text-sm text-[#f0f0f0] leading-relaxed ${isFullscreen ? "max-w-[65%]" : "max-w-[85%]"}`}>
                  {turn.userMsg}
                </div>
              </div>
              {/* Dashboard */}
              {turn.dashboard && (
                <div className="w-full overflow-hidden rounded-xl border border-white/[0.07] bg-[#1a1a1a] p-3">
                  {turn.dashboard}
                </div>
              )}
              {/* Assistant text */}
              {turn.text && (
                <div className={`self-start rounded-2xl rounded-bl-sm border border-white/[0.07] bg-[#1f1f1f] px-3.5 py-2.5 text-sm text-[#c0c0c0] leading-relaxed ${isFullscreen ? "max-w-[75%]" : "max-w-[90%]"}`}>
                  {renderMarkdown(turn.text)}
                </div>
              )}
            </div>
          ))}

          {/* ── Current in-progress turn ──────────────────────────────────── */}
          {pendingUserMsg && (
            <div className="flex justify-end">
              <div className={`rounded-2xl rounded-br-sm bg-[#2a2a2a] px-3.5 py-2.5 text-sm text-[#f0f0f0] leading-relaxed ${isFullscreen ? "max-w-[65%]" : "max-w-[85%]"}`}>
                {pendingUserMsg}
              </div>
            </div>
          )}

          {/* ── Live stepper (while AI is running queries / building dashboard) */}
          {showStepper && (
            <AgentStepper steps={steps} isLoading={isLoading} />
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Suggestion carousel — only when no conversation yet ─────────── */}
      {showEmptyState && (
        <div className={fsCol}>
          <SuggestionCarousel suggestions={SUGGESTIONS} onSelect={(p) => void submit(p)} />
        </div>
      )}

      {/* ── Input bar ────────────────────────────────────────────────────── */}
      <div className={`shrink-0 border-t border-white/[0.06] bg-[#161616] ${isFullscreen ? "px-4 py-4" : "px-3 py-2.5"}`}>
        <div className={`${fsCol}`}>
          <div className={`flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 focus-within:border-violet-500/30 focus-within:bg-white/[0.05] transition-colors ${isFullscreen ? "py-3" : "py-1.5"}`}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Ask an analytics question…"
              disabled={Boolean(pendingUserMsg) || isLoading}
              className="flex-1 resize-none overflow-y-auto bg-transparent text-sm text-[#f0f0f0] placeholder:text-[#b0b0b0] outline-none disabled:opacity-40 leading-5"
              style={{ minHeight: "20px", maxHeight: isFullscreen ? "120px" : "60px" }}
            />
            <button
              type="button"
              onClick={isLoading ? stopGeneration : () => void submit(input)}
              aria-label={isLoading ? "Stop generation" : "Send message"}
              className="mb-0.5 shrink-0 rounded-lg p-1.5 text-violet-400 transition hover:text-violet-300 disabled:opacity-30"
              disabled={!isLoading && !input.trim()}
            >
              {isLoading ? (
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16" aria-hidden>
                  <rect x="3" y="3" width="10" height="10" rx="2" />
                </svg>
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </div>
          <p className="mt-1.5 text-center text-[10px] text-[#2a2a2a]">Powered by CopilotKit</p>
        </div>
      </div>
    </div>
  );
}
