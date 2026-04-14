"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useCopilotChatInternal, useCopilotAdditionalInstructions } from "@copilotkit/react-core";
import { SYSTEM_PROMPT } from "@/lib/prompts/system";
import type { OverviewCounts, OverviewCountsResponse } from "@/lib/overview/types";
import KpiCard from "@/components/widgets/KpiCard";
import BarChartWidget from "@/components/widgets/BarChartWidget";
import LineChartWidget from "@/components/widgets/LineChartWidget";
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

function fmtCount(n: number | undefined): string {
  if (n === undefined) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
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

// ── Sub-components ─────────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-1.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce"
          style={{ animationDelay: `${i * 0.18}s`, animationDuration: "0.9s" }}
        />
      ))}
    </div>
  );
}

function AgentStepper({ steps, isLoading }: { steps: Step[]; isLoading: boolean }) {
  if (steps.length === 0 && !isLoading) return null;

  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/50 px-3.5 py-3">
      {/* Header */}
      <div className="flex items-center gap-2 mb-0.5">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
          Monocle is working
        </span>
      </div>

      {steps.length === 0 && isLoading && (
        <div className="flex items-center gap-2 pl-0.5">
          <TypingDots />
          <span className="text-xs text-zinc-500">Thinking…</span>
        </div>
      )}

      {steps.map((step, i) => (
        <div key={step.id ?? i} className="flex items-center gap-2.5 pl-0.5">
          {step.status === "done" ? (
            /* Checkmark */
            <svg className="h-3.5 w-3.5 shrink-0 text-emerald-400" viewBox="0 0 16 16" fill="none" aria-hidden>
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3" opacity="0.35" />
              <path d="M4.5 8.2l2.2 2.2 4.3-4.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            /* Spinner */
            <svg className="h-3.5 w-3.5 shrink-0 animate-spin text-emerald-400" viewBox="0 0 16 16" fill="none" aria-hidden>
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="28" strokeDashoffset="10" strokeLinecap="round" opacity="0.8" />
            </svg>
          )}
          <span className={`text-xs leading-snug ${step.status === "done" ? "text-zinc-500" : "text-zinc-300"}`}>
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Predefined suggestion prompts ─────────────────────────────────────────────

const SUGGESTIONS = [
  { label: "Platform overview", prompt: "Give me a platform overview" },
  { label: "Calls trend", prompt: "How are calls trending this month?" },
  { label: "Common errors", prompt: "What are the most common errors?" },
  { label: "ASR latency", prompt: "Show ASR latency over time" },
];

// ── Main component ────────────────────────────────────────────────────────────

export default function MonocleChat() {
  useCopilotAdditionalInstructions({ instructions: SYSTEM_PROMPT }, []);

  const { messages, sendMessage, isLoading, stopGeneration } =
    useCopilotChatInternal();

  const [input, setInput] = useState("");
  const [counts, setCounts] = useState<OverviewCounts | null>(null);
  const [pendingUserMsg, setPendingUserMsg] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/overview/counts", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((body: OverviewCountsResponse & { error?: string }) => {
        if (body.counts) setCounts(body.counts);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
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
          <div className="flex flex-col gap-4 pb-2">
            <div className="flex flex-col items-center gap-2 pt-2">
              <MonocleMarkAnimated size={56} title="Monocle AI" />
              <p className="text-xs text-zinc-500 text-center">
                Ask anything — I&apos;ll query your data and build a live dashboard.
              </p>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              <KpiCard label="Users"     value={fmtCount(counts?.users)}     compact />
              <KpiCard label="Calls"     value={fmtCount(counts?.calls)}     compact />
              <KpiCard label="Questions" value={fmtCount(counts?.questions)} compact />
              <KpiCard label="Errors"    value={fmtCount(counts?.errors)}    compact />
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <BarChartWidget
                title="By Channel"
                data={[
                  { channel: "Voice", questions: 1420000 },
                  { channel: "Chat", questions: 305696 },
                ]}
                xKey="channel"
                yKeys={["questions"]}
                chartHeight={120}
              />
              <LineChartWidget
                title="Calls Trend"
                data={[
                  { day: "M", calls: 820 },
                  { day: "T", calls: 950 },
                  { day: "W", calls: 1100 },
                  { day: "T", calls: 870 },
                  { day: "F", calls: 1230 },
                  { day: "S", calls: 650 },
                  { day: "S", calls: 480 },
                ]}
                xKey="day"
                yKeys={["calls"]}
                chartHeight={120}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Try asking</p>
              <div className="grid grid-cols-2 gap-1.5">
                {SUGGESTIONS.map(({ label, prompt }) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void submit(prompt)}
                    className="rounded-xl border border-zinc-700/60 bg-zinc-900/60 px-3 py-2.5 text-left text-xs text-zinc-400 transition hover:border-emerald-500/40 hover:bg-zinc-900/90 hover:text-zinc-200 leading-snug"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Rendered messages ─────────────────────────────────────────── */}
        {visible.map((msg) => {
          if (msg.role === "user") {
            return (
              <div key={msg.id} className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-sm border border-white/[0.09] bg-white/[0.06] px-3.5 py-2.5 text-sm text-zinc-100 leading-relaxed">
                  {extractText(msg.content)}
                </div>
              </div>
            );
          }

          if (msg.role === "assistant") {
            const text = extractText(msg.content).trim();
            if (!text) return null;
            return (
              <div key={msg.id} className="max-w-[90%] self-start rounded-2xl rounded-bl-sm border border-emerald-500/[0.18] bg-emerald-500/[0.07] px-3.5 py-2.5 text-sm text-zinc-200 leading-relaxed">
                {renderMarkdown(text)}
              </div>
            );
          }

          return null;
        })}

        {/* ── AGUI Dashboard — rendered directly from render_dashboard tool call */}
        {dashboardNode && (
          <div className="w-full overflow-hidden rounded-xl border border-emerald-500/20 bg-zinc-900/60 p-3">
            {dashboardNode}
          </div>
        )}

        {/* ── Optimistic user bubble ────────────────────────────────────── */}
        {pendingUserMsg && !visible.some(
          (m) => m.role === "user" && extractText(m.content).trim() === pendingUserMsg,
        ) && (
          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl rounded-br-sm border border-white/[0.09] bg-white/[0.06] px-3.5 py-2.5 text-sm text-zinc-100 leading-relaxed">
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

      {/* ── Input bar ────────────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-emerald-500/[0.18] bg-zinc-950/95 px-3 py-2.5">
        <div className="flex items-end gap-2 rounded-xl border border-zinc-700/55 bg-zinc-900/80 px-3 py-2 focus-within:border-emerald-500/50 transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Ask an analytics question…"
            disabled={Boolean(pendingUserMsg) || isLoading}
            className="flex-1 resize-none bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 outline-none disabled:opacity-40 leading-relaxed"
            style={{ minHeight: "22px", maxHeight: "120px" }}
          />
          <button
            type="button"
            onClick={isLoading ? stopGeneration : () => void submit(input)}
            aria-label={isLoading ? "Stop generation" : "Send message"}
            className="mb-0.5 shrink-0 rounded-lg p-1.5 text-emerald-400 transition hover:text-emerald-300 disabled:opacity-40"
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
        <p className="mt-1.5 text-center text-[10px] text-zinc-700">Powered by CopilotKit</p>
      </div>
    </div>
  );
}
