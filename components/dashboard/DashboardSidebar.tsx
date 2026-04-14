"use client";

import MonocleMarkAnimated from "@/components/brand/MonocleMarkAnimated";
import { PRODUCT_NAME, PRODUCT_TAGLINE } from "@/lib/brand";
import { useLogout } from "@/lib/auth/useLogout";

type NavItem = { id: string; label: string; icon: React.ReactNode; badge?: string; disabled?: boolean };
type NavSection = { title?: string; items: NavItem[] };

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg className="h-[18px] w-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} aria-hidden>
      {children}
    </svg>
  );
}

const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      {
        id: "overview",
        label: "Overview",
        icon: (
          <Icon>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5H9a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 019 20.25H6a2.25 2.25 0 01-2.25-2.25v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25A2.25 2.25 0 0113.5 8.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </Icon>
        ),
      },
    ],
  },
  {
    title: "Analytics",
    items: [
      {
        id: "calls",
        label: "Calls",
        icon: (
          <Icon>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
          </Icon>
        ),
        // enabled
      },
      {
        id: "questions",
        label: "Questions",
        icon: (
          <Icon>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </Icon>
        ),
        // enabled
      },
      {
        id: "errors",
        label: "Errors",
        icon: (
          <Icon>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </Icon>
        ),
        // enabled
      },
    ],
  },
  {
    title: "Platform",
    items: [
      {
        id: "asr",
        label: "ASR",
        icon: (
          <Icon>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
          </Icon>
        ),
        // enabled
      },
      {
        id: "tts",
        label: "TTS",
        icon: (
          <Icon>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
          </Icon>
        ),
        // enabled
      },
    ],
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
        className={`flex h-full shrink-0 flex-col border-r border-white/[0.05] bg-[#141414] transition-[width] duration-200 ease-out ${
          collapsed ? "w-[60px]" : "w-[220px]"
        }`}
      >
        {/* Logo / Brand */}
        <div className={`flex shrink-0 items-center border-b border-white/[0.05] ${collapsed ? "h-[58px] justify-center px-2" : "h-[58px] gap-2.5 px-4"}`}>
          {collapsed ? (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label="Expand sidebar"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1f1f1f] ring-1 ring-white/[0.07] transition hover:ring-violet-500/30"
            >
              <MonocleMarkAnimated size={28} title={PRODUCT_NAME} />
            </button>
          ) : (
            <>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#1c1c1c] ring-1 ring-white/[0.07]">
                <MonocleMarkAnimated size={28} title={PRODUCT_NAME} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-[#e8e8e8] leading-tight">{PRODUCT_NAME}</p>
                <p className="truncate text-[10px] text-[#a0a0a0] leading-tight mt-0.5">{PRODUCT_TAGLINE}</p>
              </div>
              <button
                type="button"
                onClick={onToggleCollapse}
                aria-label="Collapse sidebar"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#909090] transition hover:bg-white/[0.05] hover:text-[#d8d8d8]"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Nav */}
        <nav className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-3" aria-label="Primary">
          {NAV_SECTIONS.map((section, si) => (
            <div key={si} className={collapsed ? "px-1.5 mb-1" : "px-2.5 mb-1"}>
              {/* Section label */}
              {section.title && !collapsed && (
                <p className="mb-1 mt-2 px-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#909090]">
                  {section.title}
                </p>
              )}
              {section.items.map((item) => {
                const active = item.id === activeId;
                const disabled = item.disabled && !active;
                return (
                  <button
                    key={item.id}
                    type="button"
                    title={collapsed ? item.label : undefined}
                    disabled={disabled}
                    onClick={() => !disabled && onNavigate(item.id)}
                    className={`
                      relative flex w-full items-center rounded-lg text-[13px] font-medium transition-all
                      ${collapsed ? "justify-center px-0 py-2.5 mb-0.5" : "gap-2.5 px-2.5 py-2 mb-0.5 text-left"}
                      ${active
                        ? "bg-violet-500/[0.12] text-violet-300"
                        : disabled
                          ? "text-[#909090] cursor-default"
                          : "text-[#c0c0c0] hover:bg-white/[0.04] hover:text-[#f0f0f0]"
                      }
                    `}
                  >
                    {/* Active left bar */}
                    {active && !collapsed && (
                      <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-violet-400" aria-hidden />
                    )}
                    <span className={active ? "text-violet-400" : disabled ? "text-[#4a4a4a]" : "text-[#b0b0b0]"}>
                      {item.icon}
                    </span>
                    {!collapsed && (
                      <span className="flex-1 truncate">{item.label}</span>
                    )}
                    {/* "Soon" badge for disabled items */}
                    {!collapsed && disabled && (
                      <span className="rounded-full bg-white/[0.04] px-1.5 py-0.5 text-[9px] font-medium text-[#909090]">
                        Soon
                      </span>
                    )}
                    {collapsed && <span className="sr-only">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className={`shrink-0 border-t border-white/[0.05] ${collapsed ? "p-1.5" : "p-2.5"}`}>
          {/* Version tag — only when expanded */}
          {!collapsed && (
            <div className="mb-2 flex items-center gap-1.5 px-2">
              <span className="h-1 w-1 rounded-full bg-emerald-400/60" aria-hidden />
              <span className="text-[10px] text-[#909090]">v1.0 · All systems operational</span>
            </div>
          )}

          <button
            type="button"
            title={collapsed ? (pending ? "Signing out" : "Log out") : undefined}
            disabled={pending}
            onClick={() => void logout()}
            className={`flex w-full items-center rounded-lg text-[12px] font-medium transition disabled:cursor-not-allowed disabled:opacity-50
              ${pending ? "text-red-400/50" : "text-[#909090] hover:bg-red-500/[0.08] hover:text-red-400"}
              ${collapsed ? "justify-center px-0 py-2.5" : "gap-2.5 px-2.5 py-2 text-left"}
            `}
          >
            {pending ? (
              <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-red-400/20 border-t-red-400" aria-hidden />
            ) : (
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} aria-hidden>
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
