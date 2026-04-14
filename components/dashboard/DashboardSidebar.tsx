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
        className={`flex h-full shrink-0 flex-col border-r border-white/[0.06] bg-[#161616] transition-[width] duration-200 ease-out ${
          collapsed ? "w-[64px]" : "w-[240px]"
        }`}
      >
        {collapsed ? (
          <div className="flex shrink-0 flex-col items-center gap-3 border-b border-white/[0.05] px-2 py-4">
            <button
              type="button"
              onClick={onToggleCollapse}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6b6b6b] transition hover:bg-white/[0.06] hover:text-[#c0c0c0]"
              aria-expanded={false}
              aria-label="Expand sidebar"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
            <div className="h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-[#1f1f1f] ring-1 ring-white/[0.08]">
              <MonocleMarkAnimated size={32} title={PRODUCT_NAME} />
            </div>
          </div>
        ) : (
          <div className="flex shrink-0 items-center gap-2 border-b border-white/[0.05] px-3 py-4">
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <div className="h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-[#1f1f1f] ring-1 ring-white/[0.08]">
                <MonocleMarkAnimated size={32} title={PRODUCT_NAME} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#f0f0f0]">{PRODUCT_NAME}</p>
                <p className="truncate text-[10px] text-[#6b6b6b]">{PRODUCT_TAGLINE}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleCollapse}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#6b6b6b] transition hover:bg-white/[0.06] hover:text-[#c0c0c0]"
              aria-expanded={true}
              aria-label="Collapse sidebar"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
          </div>
        )}

        <nav
          className={`min-h-0 flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden pb-4 ${collapsed ? "px-1.5 pt-2" : "px-2 pt-1"}`}
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
                className={`flex w-full items-center rounded-lg text-[13px] font-medium transition ${
                  collapsed ? "justify-center px-0 py-2.5" : "gap-2.5 px-2.5 py-2 text-left"
                } ${
                  active
                    ? "bg-violet-500/10 text-violet-300 ring-1 ring-violet-500/20"
                    : "text-[#7a7a7a] hover:bg-white/[0.05] hover:text-[#c0c0c0]"
                }`}
              >
                <span className={`shrink-0 ${active ? "text-violet-400" : "text-[#7a7a7a]"}`}>{item.icon}</span>
                <span className={collapsed ? "sr-only" : "truncate"}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className={`shrink-0 border-t border-white/[0.05] ${collapsed ? "p-1.5" : "p-2"}`}>
          <button
            type="button"
            title={collapsed ? (pending ? "Signing out" : "Log out") : undefined}
            disabled={pending}
            onClick={() => void logout()}
            className={`flex w-full items-center rounded-lg text-[13px] font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
              pending
                ? "text-red-400/60"
                : "text-[#7a7a7a] hover:bg-red-500/10 hover:text-red-400"
            } ${collapsed ? "justify-center px-0 py-2.5" : "gap-2.5 px-2.5 py-2 text-left"}`}
          >
            {pending ? (
              <span
                className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-red-400/20 border-t-red-400"
                aria-hidden
              />
            ) : (
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
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
