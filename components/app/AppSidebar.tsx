"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { OVERVIEW_METRIC_NAV } from "@/components/app/OverviewStats";
import { useLogout } from "@/lib/auth/useLogout";
import { PRODUCT_NAME, PRODUCT_TAGLINE } from "@/lib/brand";

const TONE_KEY = "monocle-sidebar-tone";
type SidebarTone = "default" | "dim" | "oled";

const toneClass: Record<SidebarTone, string> = {
  default: "bg-zinc-950",
  dim: "bg-zinc-900",
  oled: "bg-black",
};

function useHash(): string {
  const [hash, setHash] = useState("");

  useEffect(() => {
    const read = () => setHash(typeof window !== "undefined" ? window.location.hash.slice(1) : "");
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  return hash;
}

function Icon({
  children,
  className = "h-[18px] w-[18px] shrink-0",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      {children}
    </svg>
  );
}

export default function AppSidebar() {
  const hash = useHash();
  const { pending, logout, toast } = useLogout();
  const [workspaceOpen, setWorkspaceOpen] = useState(true);
  const [tone, setTone] = useState<SidebarTone>("default");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(TONE_KEY) as SidebarTone | null;
      if (raw && raw in toneClass) setTone(raw);
    } catch {
      /* ignore */
    }
  }, []);

  const cycleTone = useCallback(() => {
    setTone((t) => {
      const next: SidebarTone = t === "default" ? "dim" : t === "dim" ? "oled" : "default";
      try {
        localStorage.setItem(TONE_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const toneTitle = useMemo(() => {
    if (tone === "dim") return "Sidebar: dim";
    if (tone === "oled") return "Sidebar: OLED black";
    return "Sidebar: default";
  }, [tone]);

  const isOverview = !hash || hash === "overview-intro";
  const isFilters = hash === "overview-filters";
  const workspaceChildActive =
    isFilters ||
    hash === "overview-metrics" ||
    OVERVIEW_METRIC_NAV.some((m) => m.id === hash);

  return (
    <>
      {toast}
      <aside
        className={`flex min-h-0 w-64 shrink-0 flex-col self-stretch overflow-hidden border-r border-emerald-500/15 ${toneClass[tone]}`}
      >
      <div className="shrink-0 border-b border-zinc-800/90 px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-bold tracking-tight text-zinc-50">{PRODUCT_NAME}</p>
          <Icon className="h-[18px] w-[18px] shrink-0 text-emerald-400/90">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v4.125c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 013 17.25v-4.125zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125v-8.25zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </Icon>
        </div>
        <p className="mt-1 truncate text-[11px] font-medium text-emerald-500/80">{PRODUCT_TAGLINE}</p>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-3" aria-label="Main">
        <a
          href="/#overview-intro"
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
            isOverview && !isFilters
              ? "bg-zinc-800/90 text-zinc-50 ring-1 ring-emerald-500/20"
              : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
          }`}
        >
          <Icon>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v4.125c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 013 17.25v-4.125zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125v-8.25zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </Icon>
          Overview
        </a>

        <div className="mt-1">
          <button
            type="button"
            onClick={() => setWorkspaceOpen((o) => !o)}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition hover:bg-zinc-800/50 hover:text-zinc-100 ${
              workspaceChildActive ? "bg-zinc-800/40 text-zinc-100" : "text-zinc-300"
            }`}
            aria-expanded={workspaceOpen}
          >
            <Icon>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v4.125c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 013 17.25v-4.125zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125v-8.25zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </Icon>
            <span className="min-w-0 flex-1 truncate">Workspace metrics</span>
            <Icon
              className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform ${workspaceOpen ? "rotate-180" : ""}`}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </Icon>
          </button>

          {workspaceOpen && (
            <div className="mt-1 border-l border-zinc-700/80 pl-2 ml-4 space-y-0.5">
              <a
                href="/#overview-filters"
                className={`flex items-center gap-2.5 rounded-md py-2 pl-2 pr-2 text-[13px] transition ${
                  isFilters
                    ? "bg-zinc-800/90 text-zinc-50 ring-1 ring-emerald-500/15"
                    : "text-zinc-500 hover:bg-zinc-800/40 hover:text-zinc-200"
                }`}
              >
                <Icon className="h-4 w-4 text-zinc-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5" />
                </Icon>
                Date range
              </a>

              <a
                href="/#overview-metrics"
                className={`flex items-center gap-2.5 rounded-md py-2 pl-2 pr-2 text-[13px] transition ${
                  hash === "overview-metrics"
                    ? "bg-zinc-800/90 text-zinc-50 ring-1 ring-emerald-500/15"
                    : "text-zinc-500 hover:bg-zinc-800/40 hover:text-zinc-200"
                }`}
              >
                <Icon className="h-4 w-4 text-zinc-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25A2.25 2.25 0 0113.5 8.25V6zM3.75 15.75a2.25 2.25 0 012.25-2.25h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25v-2.25z" />
                </Icon>
                All metrics
              </a>

              {OVERVIEW_METRIC_NAV.map((m) => {
                const active = hash === m.id;
                return (
                  <a
                    key={m.key}
                    href={`/#${m.id}`}
                    className={`flex items-center gap-2.5 rounded-md py-2 pl-2 pr-2 text-[13px] transition ${
                      active
                        ? "bg-zinc-800/90 text-zinc-50 ring-1 ring-emerald-500/15"
                        : "text-zinc-500 hover:bg-zinc-800/40 hover:text-zinc-200"
                    }`}
                  >
                    <MetricIcon metricKey={m.key} className={active ? "text-emerald-400/90" : "text-zinc-500"} />
                    {m.label}
                  </a>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-4 space-y-0.5 border-t border-zinc-800/80 pt-3">
          <div
            className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-600"
            title="Coming soon"
          >
            <Icon>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </Icon>
            Call logs
          </div>
          <div
            className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-600"
            title="Coming soon"
          >
            <Icon>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
            </Icon>
            Service status
          </div>
        </div>

        <a
          href="/#copilot-dashboards"
          className={`mt-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
            hash === "copilot-dashboards"
              ? "bg-zinc-800/90 text-zinc-50 ring-1 ring-emerald-500/20"
              : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
          }`}
        >
          <Icon>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
          </Icon>
          Copilot dashboards
        </a>
      </nav>

      <div className="shrink-0 border-t border-zinc-800/90 p-3">
        <div className="mb-2 flex items-center gap-2">
          <button
            type="button"
            onClick={cycleTone}
            title={toneTitle}
            className="flex h-10 flex-1 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900/80 text-zinc-400 transition hover:border-emerald-500/30 hover:text-emerald-200"
            aria-label={toneTitle}
          >
            <Icon className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
            </Icon>
          </button>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() => void logout()}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 py-2.5 text-sm font-semibold text-zinc-200 transition hover:border-red-500/40 hover:bg-red-950/25 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? (
            <span
              className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-zinc-600 border-t-red-400"
              aria-hidden
            />
          ) : (
            <Icon className="h-4 w-4 text-zinc-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M18 9l3 3m0 0l-3 3m3-3H9" />
            </Icon>
          )}
          {pending ? "Signing out…" : "Log out"}
        </button>
      </div>
    </aside>
    </>
  );
}

function MetricIcon({ metricKey, className }: { metricKey: string; className?: string }) {
  const cn = `h-4 w-4 shrink-0 ${className ?? ""}`;
  switch (metricKey) {
    case "users":
      return (
        <Icon className={cn}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </Icon>
      );
    case "sessions":
      return (
        <Icon className={cn}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5" />
        </Icon>
      );
    case "questions":
      return (
        <Icon className={cn}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
        </Icon>
      );
    case "errors":
      return (
        <Icon className={cn}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </Icon>
      );
    case "asrLogs":
      return (
        <Icon className={cn}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m12 0V9a3 3 0 00-3-3H9a3 3 0 00-3 3v8.25m12 0a3 3 0 003-3V9a3 3 0 00-3-3h-1.5m-6 7.5v4.875c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 013 19.875v-4.5m12 0v.75a3 3 0 003 3h1.5m-6-7.5h1.5m0 0h1.5m-1.5 0v.75m0 0v.75" />
        </Icon>
      );
    case "ttsLogs":
      return (
        <Icon className={cn}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
        </Icon>
      );
    case "toolCalls":
      return (
        <Icon className={cn}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655-5.653a2.548 2.548 0 010-3.586L11.42 15.17z" />
        </Icon>
      );
    default:
      return (
        <Icon className={cn}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z" />
        </Icon>
      );
  }
}
