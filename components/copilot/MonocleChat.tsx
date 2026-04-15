"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useCopilotChatInternal, useCopilotAdditionalInstructions } from "@copilotkit/react-core";
import { SYSTEM_PROMPT } from "@/lib/prompts/system";

import MonocleMarkAnimated from "@/components/brand/MonocleMarkAnimated";
import DashboardRenderer from "@/components/DashboardRenderer";
import DashboardSkeleton from "@/components/DashboardSkeleton";
import { DashboardSchema } from "@/lib/schemas/dashboard";

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

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-1.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce"
          style={{ animationDelay: `${i * 0.18}s`, animationDuration: "0.9s" }}
        />
      ))}
    </div>
  );
}

function AgentStepper({ steps, isLoading }: { steps: Step[]; isLoading: boolean }) {
  if (steps.length === 0 && !isLoading) return null;

  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-white/[0.07] bg-[#1f1f1f] px-3.5 py-3">
      {/* Header */}
      <div className="flex items-center gap-2 mb-0.5">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-50" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-400" />
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[#c0c0c0]">
          Monocle is working
        </span>
      </div>

      {steps.length === 0 && isLoading && (
        <div className="flex items-center gap-2 pl-0.5">
          <TypingDots />
          <span className="text-xs text-[#c0c0c0]">Thinking…</span>
        </div>
      )}

      {steps.map((step, i) => (
        <div key={step.id ?? i} className="flex items-center gap-2.5 pl-0.5">
          {step.status === "done" ? (
            <svg className="h-3.5 w-3.5 shrink-0 text-violet-400" viewBox="0 0 16 16" fill="none" aria-hidden>
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3" opacity="0.3" />
              <path d="M4.5 8.2l2.2 2.2 4.3-4.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg className="h-3.5 w-3.5 shrink-0 animate-spin text-violet-400" viewBox="0 0 16 16" fill="none" aria-hidden>
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="28" strokeDashoffset="10" strokeLinecap="round" opacity="0.8" />
            </svg>
          )}
          <span className={`text-xs leading-snug ${step.status === "done" ? "text-[#c8c8c8]" : "text-[#c0c0c0]"}`}>
            {step.label}
          </span>
        </div>
      ))}
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

export default function MonocleChat() {
  useCopilotAdditionalInstructions({ instructions: SYSTEM_PROMPT }, []);

  const { messages, sendMessage, isLoading, stopGeneration } =
    useCopilotChatInternal();

  const [input, setInput] = useState("");
  const [pendingUserMsg, setPendingUserMsg] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    if (!input) {
      // Empty — always reset to single line
      ta.style.height = "20px";
      return;
    }
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 60)}px`;
  }, [input]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, pendingUserMsg]);

  useEffect(() => {
    if (!pendingUserMsg) return;
    const msgs = messages as unknown as AnyMessage[];
    const hasRealUserMsg = msgs.some(
      (m) => m.role === "user" && Boolean(extractText(m.content).trim()),
    );
    if (hasRealUserMsg) setPendingUserMsg(null);
  }, [messages, pendingUserMsg]);

  const sendingRef = useRef(false);

  const submit = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sendingRef.current) return;
      sendingRef.current = true;
      setInput("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
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

  // User messages to always show
  const userMsgs = allMsgs.filter(
    (m) => m.role === "user" && Boolean(extractText(m.content).trim()),
  );

  // Assistant messages to show — only when the run is COMPLETE (not loading).
  // While isLoading: hide all assistant text — the stepper is the only indicator.
  const assistantMsgs = isLoading
    ? []
    : allMsgs.filter((m) => {
        if (m.role !== "assistant") return false;
        return Boolean(extractText(m.content).trim());
      });

  // Extract the dashboard from render_dashboard tool call (bypasses useLazyToolRenderer
  // which only handles toolCalls[0] and misses render_dashboard when it's called
  // after multiple SQL queries on the same assistant message)
  const dashboardNode = isLoading ? null : extractDashboardRender(allMsgs);

  // Combine for rendering — preserve message order
  const visible = allMsgs.filter((m) => {
    if (userMsgs.includes(m)) return true;
    if (assistantMsgs.includes(m)) return true;
    return false;
  });

  // Build stepper from all messages (including tool-call/tool-result roles)
  const steps = buildSteps(allMsgs);

  // Show stepper ONLY while the AI is actively running — hide as soon as done
  const showStepper = isLoading;

  // Empty state: no user messages yet, nothing pending, not loading
  const showEmptyState = userMsgs.length === 0 && !pendingUserMsg && !isLoading;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* ── Message list ─────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3 scroll-smooth">

        {/* ── Empty state ──────────────────────────────────────────────── */}
        {showEmptyState && (
          <div className="flex flex-col gap-5 pb-2 pt-2">

            {/* Brand + headline */}
            <div className="flex flex-col items-center gap-3 pt-2">
              <MonocleMarkAnimated size={44} title="Monocle AI" />
              <div className="text-center">
                <p className="text-sm font-semibold text-[#e0e0e0] leading-snug">Monocle AI</p>
                <p className="mt-1 text-[11px] text-[#c0c0c0] leading-relaxed max-w-[220px]">
                  Ask questions in plain language — I&apos;ll query your data and build a live dashboard instantly.
                </p>
              </div>
            </div>

            {/* What I can do */}
            <div className="flex flex-col gap-2">
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#b0b0b0] px-0.5">What I can do</p>
              {[
                {
                  icon: (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                    </svg>
                  ),
                  title: "Build live dashboards",
                  desc: "Charts, KPIs, and tables generated from your real data",
                },
                {
                  icon: (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 2.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                    </svg>
                  ),
                  title: "Query any metric",
                  desc: "Calls, questions, ASR/TTS latency, errors, user trends",
                },
                {
                  icon: (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
                    </svg>
                  ),
                  title: "Filter by date range",
                  desc: "Compare this week vs last week, month-over-month, custom ranges",
                },
                {
                  icon: (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  ),
                  title: "Natural language",
                  desc: "No SQL needed — just ask like you&apos;re talking to an analyst",
                },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-2.5 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2.5">
                  <span className="mt-0.5 shrink-0 text-violet-400">{item.icon}</span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-[#d0d0d0] leading-tight">{item.title}</p>
                    <p className="mt-0.5 text-[10px] text-[#e0e0e0] leading-snug">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* ── Rendered messages ─────────────────────────────────────────── */}
        {visible.map((msg) => {
          if (msg.role === "user") {
            return (
              <div key={msg.id} className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-[#2a2a2a] px-3.5 py-2.5 text-sm text-[#f0f0f0] leading-relaxed">
                  {extractText(msg.content)}
                </div>
              </div>
            );
          }

          if (msg.role === "assistant") {
            const text = extractText(msg.content).trim();
            if (!text) return null;
            return (
              <div key={msg.id} className="max-w-[90%] self-start rounded-2xl rounded-bl-sm border border-white/[0.07] bg-[#1f1f1f] px-3.5 py-2.5 text-sm text-[#c0c0c0] leading-relaxed">
                {renderMarkdown(text)}
              </div>
            );
          }

          return null;
        })}

        {/* ── AGUI Dashboard — rendered directly from render_dashboard tool call */}
        {dashboardNode && (
          <div className="w-full overflow-hidden rounded-xl border border-white/[0.07] bg-[#1a1a1a] p-3">
            {dashboardNode}
          </div>
        )}

        {/* ── Optimistic user bubble ────────────────────────────────────── */}
        {pendingUserMsg && !visible.some(
          (m) => m.role === "user" && extractText(m.content).trim() === pendingUserMsg,
        ) && (
          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-[#2a2a2a] px-3.5 py-2.5 text-sm text-[#f0f0f0] leading-relaxed">
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

      {/* ── Suggestion carousel — only when no conversation yet ─────────── */}
      {showEmptyState && (
        <SuggestionCarousel suggestions={SUGGESTIONS} onSelect={(p) => void submit(p)} />
      )}

      {/* ── Input bar ────────────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-white/[0.06] bg-[#161616] px-3 py-2.5">
        <div className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-1.5 focus-within:border-violet-500/30 focus-within:bg-white/[0.05] transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Ask an analytics question…"
            disabled={Boolean(pendingUserMsg) || isLoading}
            className="flex-1 resize-none overflow-y-auto bg-transparent text-sm text-[#f0f0f0] placeholder:text-[#b0b0b0] outline-none disabled:opacity-40 leading-5"
            style={{ minHeight: "20px", maxHeight: "60px" }}
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
  );
}
