"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useCopilotChatInternal, useCopilotAdditionalInstructions } from "@copilotkit/react-core";
import { SYSTEM_PROMPT } from "@/lib/prompts/system";
import type { OverviewCounts, OverviewCountsResponse } from "@/lib/overview/types";
import KpiCard from "@/components/widgets/KpiCard";
import BarChartWidget from "@/components/widgets/BarChartWidget";
import LineChartWidget from "@/components/widgets/LineChartWidget";

// ── Types ────────────────────────────────────────────────────────────────────

type AnyMessage = {
  id: string;
  role: string;
  content: unknown;
  generativeUI?: () => React.ReactNode;
  generativeUIPosition?: "before" | "after";
};

// ── Helpers ──────────────────────────────────────────────────────────────────

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

/**
 * Minimal inline markdown renderer — handles bold, inline code, and newlines.
 * Full markdown libraries (react-markdown) are not installed; this covers what
 * the AI actually generates in this context.
 */
function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  return lines.map((line, li) => {
    // Split by **bold** and `code` patterns
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
    let last = 0;
    let match: RegExpExecArray | null;
    let key = 0;
    while ((match = regex.exec(line)) !== null) {
      if (match.index > last) {
        parts.push(line.slice(last, match.index));
      }
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

// ── Sub-components ────────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-2">
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

// ── Main component ────────────────────────────────────────────────────────────

interface MonocleChatProps {
  /** Optional initial message to send once the chat mounts */
  initialMessage?: string;
}

export default function MonocleChat({ initialMessage }: MonocleChatProps) {
  // Register system prompt — stable empty deps means it only runs once on mount.
  useCopilotAdditionalInstructions({ instructions: SYSTEM_PROMPT }, []);

  const { messages, sendMessage, isLoading, stopGeneration } =
    useCopilotChatInternal();

  const [input, setInput] = useState("");
  const [counts, setCounts] = useState<OverviewCounts | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sentInitial = useRef(false);

  // Fetch real counts from the API to show in the empty-state KPI cards
  useEffect(() => {
    fetch("/api/overview/counts", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((body: OverviewCountsResponse & { error?: string }) => {
        if (body.counts) setCounts(body.counts);
      })
      .catch(() => {/* silently ignore — preview falls back to null */});
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [input]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send initial message if provided (e.g. from the quick-input bar)
  useEffect(() => {
    if (initialMessage && !sentInitial.current && !isLoading) {
      sentInitial.current = true;
      void sendMessage({ id: `user-init-${Date.now()}`, role: "user", content: initialMessage });
    }
  }, [initialMessage, sendMessage, isLoading]);

  const submit = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;
      setInput("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      await sendMessage({ id: `user-${Date.now()}`, role: "user", content: trimmed });
    },
    [isLoading, sendMessage],
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

  // Cast messages to our local type (generativeUI is injected by useCopilotChatInternal)
  const chatMessages = messages as unknown as AnyMessage[];

  // Only show user + assistant messages that have actual content to display.
  // Filter out empty assistant placeholders (CopilotKit creates these at stream start).
  const visible = chatMessages.filter((m) => {
    if (m.role === "user") return Boolean(extractText(m.content).trim());
    if (m.role === "assistant") {
      const text = extractText(m.content).trim();
      const hasGenUI = typeof m.generativeUI === "function";
      return Boolean(text) || hasGenUI;
    }
    return false;
  });

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* ── Message list ───────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3 scroll-smooth">
        {visible.length === 0 && (
          <div className="flex flex-col gap-3 pb-4">
            {/* Header */}
            <div className="pt-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">What I can build for you</p>
            </div>

            {/* KPI cards — real counts from the API */}
            <div className="grid grid-cols-4 gap-1.5">
              <KpiCard label="Users"     value={fmtCount(counts?.users)}     compact />
              <KpiCard label="Calls"     value={fmtCount(counts?.calls)}     compact />
              <KpiCard label="Questions" value={fmtCount(counts?.questions)} compact />
              <KpiCard label="Errors"    value={fmtCount(counts?.errors)}    compact />
            </div>

            {/* Charts — side by side, compact height */}
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

            {/* Quick prompts */}
            <div className="flex flex-col gap-1.5">
              <p className="text-[10px] uppercase tracking-widest text-zinc-600">Try asking</p>
              {[
                "Give me a platform overview",
                "How are calls trending this month?",
                "What are the most common errors?",
                "Show ASR latency over time",
              ].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => void submit(q)}
                  className="w-full rounded-lg border border-zinc-700/60 bg-zinc-900/50 px-3 py-1.5 text-left text-xs text-zinc-400 transition hover:border-emerald-500/40 hover:text-zinc-200"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

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
            const genUI = msg.generativeUI;
            const text = extractText(msg.content).trim();
            const hasGenUI = typeof genUI === "function";
            const hasText = Boolean(text);

            // Skip empty messages (already filtered above, but belt-and-suspenders)
            if (!hasGenUI && !hasText) return null;

            return (
              <div key={msg.id} className="flex flex-col gap-2">
                {/* Generative UI (dashboard / chart widgets) */}
                {hasGenUI && (
                  <div className="w-full overflow-hidden rounded-xl border border-emerald-500/20 bg-zinc-900/60 p-3">
                    {genUI()}
                  </div>
                )}
                {/* Assistant text — show alongside or instead of genUI */}
                {hasText && (
                  <div className="max-w-[90%] self-start rounded-2xl rounded-bl-sm border border-emerald-500/[0.18] bg-emerald-500/[0.07] px-3.5 py-2.5 text-sm text-zinc-200 leading-relaxed">
                    {renderMarkdown(text)}
                  </div>
                )}
              </div>
            );
          }

          return null;
        })}

        {isLoading && <TypingDots />}
        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ──────────────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-emerald-500/[0.18] bg-zinc-950/95 px-3 py-2.5">
        <div className="flex items-end gap-2 rounded-xl border border-zinc-700/55 bg-zinc-900/80 px-3 py-2 focus-within:border-emerald-500/50 transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Ask an analytics question…"
            disabled={isLoading}
            className="flex-1 resize-none bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 outline-none disabled:opacity-50 leading-relaxed"
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
              /* Stop icon */
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16" aria-hidden>
                <rect x="3" y="3" width="10" height="10" rx="2" />
              </svg>
            ) : (
              /* Send icon */
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
