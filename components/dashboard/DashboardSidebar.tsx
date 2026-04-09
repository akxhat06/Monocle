"use client";

import MonocleMarkAnimated from "@/components/brand/MonocleMarkAnimated";
import { PRODUCT_NAME, PRODUCT_TAGLINE } from "@/lib/brand";
import { useLogout } from "@/lib/auth/useLogout";

type NavItem = { id: string; label: string; icon: React.ReactNode };

function NavIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      {children}
    </svg>
  );
}

const NAV: NavItem[] = [
  {
    id: "overview",
    label: "Overview",
    icon: (
      <NavIcon>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75a2.25 2.25 0 012.25-2.25H9a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 019 20.25H6a2.25 2.25 0 01-2.25-2.25v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25A2.25 2.25 0 0113.5 8.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </NavIcon>
    ),
  },
];

type Props = {
  activeId: string;
  collapsed: boolean;
  onNavigate: (id: string) => void;
  onToggleCollapse: () => void;
};

export default function DashboardSidebar({ activeId, collapsed, onNavigate, onToggleCollapse }: Props) {
  const { pending, logout, toast } = useLogout();

  return (
    <>
      {toast}
      <aside
        className={`flex h-full shrink-0 flex-col border-r border-[color:var(--oa-border-green)] bg-zinc-950/90 backdrop-blur-md transition-[width] duration-200 ease-out ${
          collapsed ? "w-[72px]" : "w-[260px]"
        }`}
      >
        {collapsed ? (
          <div className="flex shrink-0 flex-col items-center gap-3 border-b border-white/[0.06] px-2 py-4">
            <button
              type="button"
              onClick={onToggleCollapse}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100"
              aria-expanded={false}
              aria-label="Expand sidebar"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-zinc-950 ring-1 ring-emerald-500/25">
              <MonocleMarkAnimated size={36} title={PRODUCT_NAME} />
            </div>
          </div>
        ) : (
          <div className="flex shrink-0 items-center gap-2 border-b border-white/[0.06] px-3 py-5">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-zinc-950 ring-1 ring-emerald-500/25">
                <MonocleMarkAnimated size={40} title={PRODUCT_NAME} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold tracking-tight text-zinc-50">{PRODUCT_NAME}</p>
                <p className="truncate text-[11px] font-medium text-emerald-500/85">{PRODUCT_TAGLINE}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleCollapse}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
              aria-expanded={true}
              aria-label="Collapse sidebar"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
          </div>
        )}

        <nav
          className={`min-h-0 flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden pb-4 ${collapsed ? "px-2 pt-2" : "px-3 pt-1"}`}
          aria-label="Primary"
        >
          {NAV.map((item) => {
            const active = item.id === activeId;
            return (
              <button
                key={item.id}
                type="button"
                title={collapsed ? item.label : undefined}
                onClick={() => onNavigate(item.id)}
                className={`flex w-full items-center rounded-xl text-[13px] font-medium transition ${
                  collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5 text-left"
                } ${
                  active
                    ? "bg-emerald-500/15 text-emerald-200 shadow-sm ring-1 ring-emerald-500/25"
                    : "text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-200"
                }`}
              >
                <span className={`shrink-0 ${active ? "text-emerald-400" : "text-zinc-500"}`}>{item.icon}</span>
                <span className={collapsed ? "sr-only" : "truncate"}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className={`shrink-0 border-t border-white/[0.06] ${collapsed ? "p-2" : "p-3"}`}>
          <button
            type="button"
            title={collapsed ? (pending ? "Signing out" : "Log out") : undefined}
            disabled={pending}
            onClick={() => void logout()}
            className={`flex w-full items-center rounded-xl text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
              pending
                ? "text-red-300/80"
                : "text-red-400/95 hover:bg-red-950/35 hover:text-red-300"
            } ${collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5 text-left"}`}
          >
            {pending ? (
              <span
                className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-red-400/25 border-t-red-400"
                aria-hidden
              />
            ) : (
              <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M18 9l3 3m0 0l-3 3m3-3H9" />
              </svg>
            )}
            <span className={collapsed ? "sr-only" : ""}>{pending ? "Signing out…" : "Log out"}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
