"use client";

import type { User } from "@supabase/supabase-js";
import { useEffect, useMemo, useRef, useState } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useNotificationStore } from "@/store/notifications";
import { useSound } from "@/lib/hooks/useSound";
import UserProfilePanel from "@/components/dashboard/UserProfilePanel";

// ── useClock ──────────────────────────────────────────────────────────────────
function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

// ── Multi-script character sets ───────────────────────────────────────────────
const SCRIPTS = [
  {
    name: "greek",
    chars: ["α","β","γ","δ","ε","ζ","η","θ","ι","κ","λ","μ","ν","ξ","ο","π","ρ","σ","τ","υ","φ","χ","ψ","ω"],
    color: "#7c6f9e",
  },
  {
    name: "japanese",
    chars: ["ア","イ","ウ","エ","オ","カ","キ","ク","ケ","コ","サ","シ","ス","セ","ソ","タ","チ","ツ","テ","ト"],
    color: "#6e8f7c",
  },
  {
    name: "arabic",
    chars: ["ا","ب","ت","ث","ج","ح","خ","د","ذ","ر","ز","س","ش","ص","ض","ط","ظ","ع","غ","ف"],
    color: "#8f7a4e",
  },
  {
    name: "korean",
    chars: ["가","나","다","라","마","바","사","아","자","차","카","타","파","하","고","노","도","로","모","보"],
    color: "#5a8a9f",
  },
];

function AnimatedDate({ dateStr }: { dateStr: string }) {
  const [visible, setVisible]       = useState(true);
  const [altStr, setAltStr]         = useState("");
  const [altColor, setAltColor]     = useState("#606060");
  const [showAlt, setShowAlt]       = useState(false);
  const tickRef                     = useRef(0);
  const scriptIdxRef                = useRef(0);

  useEffect(() => {
    const id = setInterval(() => {
      tickRef.current += 1;
      if (tickRef.current % 3 === 0) {
        const script = SCRIPTS[scriptIdxRef.current % SCRIPTS.length];
        scriptIdxRef.current += 1;

        // fade out
        setVisible(false);
        setTimeout(() => {
          const s = Array.from({ length: dateStr.length }, (_, i) =>
            /[a-zA-Z]/.test(dateStr[i])
              ? script.chars[Math.floor(Math.random() * script.chars.length)]
              : dateStr[i]
          ).join("");
          setAltStr(s);
          setAltColor(script.color);
          setShowAlt(true);
          setVisible(true);
        }, 280);

        // fade back to date
        setTimeout(() => {
          setVisible(false);
          setTimeout(() => { setShowAlt(false); setVisible(true); }, 280);
        }, 1600);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [dateStr]);

  return (
    <span
      className="font-mono text-[12px] font-medium tracking-wide transition-all duration-300"
      style={{
        opacity: visible ? 1 : 0,
        color: showAlt ? altColor : "#606060",
        letterSpacing: showAlt ? "0.1em" : "0.04em",
      }}
    >
      {showAlt ? altStr : dateStr}
    </span>
  );
}

// ── displayFromUser ───────────────────────────────────────────────────────────
function displayFromUser(user: User): { primary: string; secondary: string; initials: string } {
  const meta = user.user_metadata ?? {};
  const email = user.email?.trim() ?? "";
  const fullName =
    (typeof meta.full_name === "string" && meta.full_name.trim()) ||
    (typeof meta.name === "string" && meta.name.trim()) ||
    (typeof meta.user_name === "string" && meta.user_name.trim()) ||
    "";
  const primary = fullName || email || "Account";
  const secondary = fullName && email && fullName !== email ? email : "";

  let initials = "?";
  if (primary.includes("@")) {
    initials = primary.split("@")[0].replace(/[^a-zA-Z0-9]/g, "").slice(0, 2).toUpperCase();
  } else {
    const parts = primary.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      initials = `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
    } else {
      initials = primary.slice(0, 2).toUpperCase();
    }
  }
  return { primary, secondary, initials };
}

// ── Relative time ─────────────────────────────────────────────────────────────
function relativeTime(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// ── DashboardHeader ───────────────────────────────────────────────────────────
export default function DashboardHeader() {
  const now = useClock();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const bellIconRef = useRef<SVGSVGElement>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const { play } = useSound();

  const notifications  = useNotificationStore((s) => s.notifications);
  const markAllRead    = useNotificationStore((s) => s.markAllRead);
  const clearAll       = useNotificationStore((s) => s.clear);
  const unreadCount    = notifications.filter((n) => !n.read).length;

  // Re-trigger shake animation every 4s when there are unread notifications
  useEffect(() => {
    if (!unreadCount || bellOpen) return;
    const id = setInterval(() => {
      const el = bellIconRef.current;
      if (!el) return;
      el.classList.remove("bell-shake");
      void (el as unknown as HTMLElement).offsetWidth; // reflow to restart animation
      el.classList.add("bell-shake");
    }, 4000);
    return () => clearInterval(id);
  }, [unreadCount, bellOpen]);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    }
    if (bellOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [bellOpen]);

  // Mark all read when popover opens
  useEffect(() => {
    if (bellOpen && unreadCount > 0) markAllRead();
  }, [bellOpen, unreadCount, markAllRead]);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    void supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const { primary, secondary, initials } = useMemo(() => {
    if (!ready || !user) return { primary: "", secondary: "", initials: "" };
    return displayFromUser(user);
  }, [ready, user]);

  const datePart = now.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const timePart = now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

  return (
    <header className="relative flex h-[58px] shrink-0 items-center justify-between border-b border-white/[0.05] bg-[#141414] px-5">
      {/* Subtle top shimmer line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" aria-hidden />

      {/* Left — page label */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_6px_rgba(139,92,246,0.6)]" aria-hidden />
          <span className="text-[13px] font-semibold text-[#f0f0f0] tracking-tight">Overview</span>
        </div>
        <span className="hidden h-4 w-px bg-white/[0.08] sm:block" aria-hidden />
        <span className="hidden text-[11px] text-[#909090] sm:block">Analytics Dashboard</span>
      </div>

      {/* Center — live clock */}
      <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-3">
        {/* Animated date */}
        <AnimatedDate dateStr={datePart} />

        {/* Divider */}
        <span className="h-3.5 w-px bg-white/[0.08]" aria-hidden />

        {/* Time — no border, just glowing text */}
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-50" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-violet-400" />
          </span>
          <span
            className="font-mono text-[14px] font-semibold tabular-nums tracking-widest"
            style={{ color: "#d0d0d0", textShadow: "0 0 12px rgba(167,139,250,0.25)" }}
          >
            {timePart}
          </span>
        </div>
      </div>

      {/* Right — actions + user */}
      <div className="flex items-center gap-1.5">

        {/* ── Notification bell + popover ──────────────────────────────── */}
        <div ref={bellRef} className="relative">
          <button
            type="button"
            aria-label="Notifications"
            onClick={() => { play("pop"); setBellOpen((o) => !o); }}
            className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition ${
              bellOpen
                ? "bg-white/[0.08] text-[#d8d8d8]"
                : "text-[#909090] hover:bg-white/[0.06] hover:text-[#d8d8d8]"
            }`}
          >
            <svg
              ref={bellIconRef}
              className="h-[22px] w-[22px]"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            {/* Unread badge */}
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-violet-500 text-[10px] font-bold text-white leading-none shadow-[0_0_8px_rgba(139,92,246,0.6)]">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
            {unreadCount === 0 && notifications.length > 0 && (
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-violet-400/50" aria-hidden />
            )}
          </button>

          {/* Popover */}
          {bellOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-80 rounded-2xl border border-white/[0.08] bg-[#1a1a1a] shadow-2xl shadow-black/60 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-semibold text-[#f0f0f0]">AI Query History</span>
                  {notifications.length > 0 && (
                    <span className="rounded-full bg-violet-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-violet-300">
                      {notifications.length}
                    </span>
                  )}
                </div>
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-[11px] text-[#5a5a5a] transition hover:text-[#c0c0c0]"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* List — max 3 items visible, then scroll */}
              <div className="max-h-[264px] overflow-y-auto overscroll-contain scrollbar-thin"
                style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(139,92,246,0.25) transparent" }}>
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                    <svg className="h-8 w-8 text-[#3a3a3a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                    </svg>
                    <p className="text-[12px] text-[#4a4a4a]">No queries yet</p>
                    <p className="text-[11px] text-[#3a3a3a]">Ask the AI assistant something to see it here</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className="flex gap-3 border-b border-white/[0.04] px-4 py-3 last:border-0 hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Icon */}
                      <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                        n.hasDashboard
                          ? "bg-violet-500/15 text-violet-400"
                          : "bg-white/[0.05] text-[#6a6a6a]"
                      }`}>
                        {n.hasDashboard ? (
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                          </svg>
                        ) : (
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                          </svg>
                        )}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-medium text-[#e0e0e0] leading-snug">
                          {n.question}
                        </p>
                        {n.answer ? (
                          <p className="mt-0.5 line-clamp-2 text-[11px] text-[#6a6a6a] leading-snug">
                            {n.answer}
                          </p>
                        ) : (
                          <p className="mt-0.5 text-[11px] text-[#4a4a4a] leading-snug italic">
                            {n.hasDashboard ? "Dashboard generated" : "Responded"}
                          </p>
                        )}
                        <p className="mt-1 text-[10px] text-[#3a3a3a]">
                          {relativeTime(n.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <span className="mx-1 h-5 w-px bg-white/[0.07]" aria-hidden />

        {/* User avatar + info */}
        <button
          type="button"
          onClick={() => { play("pop"); setProfileOpen(true); }}
          className="flex items-center gap-2.5 rounded-xl border border-transparent px-2 py-1.5 transition hover:border-white/[0.08] hover:bg-white/[0.04]"
        >
          <div className="relative h-7 w-7 shrink-0">
            {ready && user?.user_metadata?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.user_metadata.avatar_url as string}
                alt="Avatar"
                className="h-7 w-7 rounded-full object-cover ring-2 ring-violet-500/20"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.style.display = "none";
                  const fallback = document.createElement("div");
                  fallback.className = "flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-violet-700 text-[11px] font-bold text-white ring-2 ring-[rgba(139,92,246,0.2)]";
                  fallback.textContent = initials;
                  img.parentElement?.appendChild(fallback);
                }}
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-violet-700 text-[11px] font-bold text-white ring-2 ring-violet-500/20">
                {!ready ? "…" : initials}
              </div>
            )}
            <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[#141414]" aria-hidden />
          </div>
          <div className="hidden min-w-0 text-left sm:block">
            <p className="truncate text-[12px] font-medium leading-tight text-[#d0d0d0] max-w-[120px]">
              {!ready ? "—" : primary}
            </p>
            {secondary && (
              <p className="truncate text-[10px] leading-tight text-[#a0a0a0] max-w-[120px]">{secondary}</p>
            )}
          </div>
          <svg className="hidden h-3 w-3 shrink-0 text-[#a0a0a0] sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      </div>

      <UserProfilePanel
        user={user}
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        onUserUpdate={(updated) => setUser(updated)}
      />
    </header>
  );
}
