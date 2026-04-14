"use client";

import type { User } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

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

export default function DashboardHeader() {
  const now = useClock();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

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
      <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-2">
        <span className="font-mono text-[13px] font-medium tabular-nums text-[#909090] tracking-wide">
          {datePart}
        </span>
        <span className="h-3 w-px bg-white/[0.08]" aria-hidden />
        <span className="font-mono text-[13px] font-semibold tabular-nums text-[#8a8a8a] tracking-widest">
          {timePart}
        </span>
      </div>

      {/* Right — actions + user */}
      <div className="flex items-center gap-1.5">
        {/* Notification bell */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-8 w-8 items-center justify-center rounded-lg text-[#909090] transition hover:bg-white/[0.06] hover:text-[#d8d8d8]"
        >
          <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
          {/* Badge */}
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-violet-400" aria-hidden />
        </button>

        {/* Settings */}
        <button
          type="button"
          aria-label="Settings"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#909090] transition hover:bg-white/[0.06] hover:text-[#d8d8d8]"
        >
          <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        <span className="mx-1 h-5 w-px bg-white/[0.07]" aria-hidden />

        {/* User avatar + info */}
        <button
          type="button"
          className="flex items-center gap-2.5 rounded-xl border border-transparent px-2 py-1.5 transition hover:border-white/[0.08] hover:bg-white/[0.04]"
        >
          {/* Avatar */}
          <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-violet-700 text-[11px] font-bold text-white ring-2 ring-violet-500/20">
            {!ready ? "…" : initials}
            {/* Online dot */}
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
    </header>
  );
}
