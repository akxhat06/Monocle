"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useCopilotChatInternal, useCopilotAdditionalInstructions } from "@copilotkit/react-core";
import { SYSTEM_PROMPT } from "@/lib/prompts/system";

// ── Types ────────────────────────────────────────────────────────────────────

type AnyMessage = {
  id: string;
  role: string;
  content: unknown;
  generativeUI?: () => React.ReactNode;
  generativeUIPosition?: "before" | "after";
};

// ── Helpers ──────────────────────────────────────────────────────────────────

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sentInitial = useRef(false);

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

  // Filter to only user + assistant messages (skip system/tool/etc.)
  const visible = chatMessages.filter(
    (m) => m.role === "user" || m.role === "assistant",
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* ── Message list ───────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3 scroll-smooth">
        {visible.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center pb-8">
            <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 p-4">
              <svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-300">Ask me anything</p>
              <p className="mt-1 text-xs text-zinc-500 max-w-[240px]">
                I&apos;ll query your analytics data and build live dashboards.
              </p>
            </div>
            <div className="mt-2 flex flex-col gap-1.5 w-full max-w-[260px]">
              {[
                "Give me a platform overview",
                "How are calls trending this month?",
                "What are the most common errors?",
              ].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => void submit(q)}
                  className="w-full rounded-xl border border-zinc-700/60 bg-zinc-900/60 px-3 py-2 text-left text-xs text-zinc-400 transition hover:border-emerald-500/40 hover:text-zinc-200"
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
            const text = extractText(msg.content);
            const hasGenUI = typeof genUI === "function";
            const hasText = Boolean(text);

            // Skip empty messages (e.g. tool-call-only messages with no text)
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
