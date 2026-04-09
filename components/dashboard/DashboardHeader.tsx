"use client";

import type { User } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

function formatHeaderDate(d: Date) {
  const date = d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: true });
  return `${date} | ${time}`;
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
    initials = primary
      .split("@")[0]
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 2)
      .toUpperCase();
    if (initials.length < 2 && primary.length >= 2) initials = primary.slice(0, 2).toUpperCase();
  } else {
    const parts = primary.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      initials = `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
    } else if (parts.length === 1 && parts[0].length >= 2) {
      initials = parts[0].slice(0, 2).toUpperCase();
    } else if (primary.length >= 1) {
      initials = primary.slice(0, 2).toUpperCase();
    }
  }
  if (!initials) initials = email ? email.slice(0, 2).toUpperCase() : "?";

  return { primary, secondary, initials };
}

export default function DashboardHeader() {
  const line = formatHeaderDate(new Date());
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    void supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const { primary, secondary, initials } = useMemo(() => {
    if (!ready) {
      return { primary: "", secondary: "", initials: "" };
    }
    if (!user) {
      return { primary: "Account", secondary: "", initials: "?" };
    }
    return displayFromUser(user);
  }, [ready, user]);

  return (
    <header className="flex h-[72px] shrink-0 items-center gap-4 border-b border-[color:var(--oa-border-green)] bg-zinc-950/35 px-5 backdrop-blur-xl">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-emerald-900 text-sm font-bold text-white ring-2 ring-emerald-500/30">
          {!ready ? "…" : initials}
        </div>
        <div className="min-w-0">
          <button
            type="button"
            className="flex max-w-[200px] items-center gap-1 text-left sm:max-w-xs"
          >
            <span className="truncate text-sm font-semibold text-zinc-100">
              {!ready ? "Loading…" : primary}
            </span>
            <svg className="h-4 w-4 shrink-0 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          {secondary ? <p className="truncate text-xs text-zinc-500">{secondary}</p> : null}
        </div>
        <div className="ml-1 hidden items-center gap-1 sm:flex">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
            aria-label="Notifications"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
          </button>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
            aria-label="Messages"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </button>
        </div>
      </div>

      <p className="hidden text-xs font-medium text-zinc-500 lg:block whitespace-nowrap">{line}</p>

      <div className="relative hidden min-w-[200px] max-w-md flex-1 md:block">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </span>
        <input
          type="search"
          placeholder="Search deals, leads, tasks…"
          className="w-full rounded-xl border border-[color:var(--oa-border-zinc)] bg-zinc-950/80 py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-emerald-500/55 focus:shadow-[0_0_0_3px_rgba(74,222,128,0.12)]"
        />
      </div>
    </header>
  );
}
