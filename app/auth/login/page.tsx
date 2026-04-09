"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import MonocleMarkAnimated from "@/components/brand/MonocleMarkAnimated";
import { PRODUCT_NAME, PRODUCT_TAGLINE, PRODUCT_VALUE_PROP } from "@/lib/brand";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const AI_DEMO_STEPS = [
  { text: "Show me spending over the last 30 days", view: "ts" as const },
  { text: "How many payments did we process this month?", view: "count" as const },
  { text: "Which categories drove the most spend last quarter?", view: "breakdown" as const },
];

const REV_MONTH_LABELS = ["J", "F", "M", "A", "M", "J", "J", "A", "S"] as const;

const REV_BAR_SCENES = [
  { pcts: [38, 44, 41, 55, 48, 62, 58, 52, 92], hotIndex: 8, badge: "+12%", foot: "$1,048" },
  { pcts: [52, 46, 58, 49, 63, 55, 47, 61, 74], hotIndex: 4, badge: "+8%", foot: "$988" },
  { pcts: [45, 53, 44, 59, 52, 68, 56, 49, 81], hotIndex: 5, badge: "+14%", foot: "$1,132" },
  { pcts: [41, 48, 55, 51, 46, 54, 64, 57, 69], hotIndex: 8, badge: "+6%", foot: "$903" },
  { pcts: [48, 42, 50, 57, 44, 51, 59, 66, 77], hotIndex: 7, badge: "+11%", foot: "$1,015" },
] as const;

const fontSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
});

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    const prevHtmlH = html.style.height;
    const prevBodyH = body.style.height;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    html.style.height = "100%";
    body.style.height = "100%";
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
      html.style.height = prevHtmlH;
      body.style.height = prevBodyH;
    };
  }, []);

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);

  // Signup state
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");
  const [showSignupPw, setShowSignupPw] = useState(false);
  const [showSignupConfirm, setShowSignupConfirm] = useState(false);
  const [agree, setAgree] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [aiDemoInput, setAiDemoInput] = useState("");
  const [aiDemoFocus, setAiDemoFocus] = useState(false);
  const [aiDemoSending, setAiDemoSending] = useState(false);
  const [aiDemoThinking, setAiDemoThinking] = useState(false);
  const [aiDemoView, setAiDemoView] = useState<null | "ts" | "count" | "breakdown">(null);
  const [aiDemoNonce, setAiDemoNonce] = useState(0);
  const [revSceneIndex, setRevSceneIndex] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      setRevSceneIndex((i) => (i + 1) % REV_BAR_SCENES.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setAiDemoView("ts");
      return;
    }

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        const id = setTimeout(() => resolve(), ms);
        timers.push(id);
      });

    const typeText = async (text: string) => {
      for (let i = 0; i < text.length; i++) {
        if (cancelled) return;
        setAiDemoInput(text.slice(0, i + 1));
        await sleep(36 + (i % 4) * 5);
      }
    };

    (async () => {
      await sleep(900);
      while (!cancelled) {
        for (const step of AI_DEMO_STEPS) {
          if (cancelled) return;
          setAiDemoView(null);
          setAiDemoInput("");
          setAiDemoFocus(false);
          setAiDemoThinking(false);
          setAiDemoSending(false);
          await sleep(520);
          if (cancelled) return;

          setAiDemoFocus(true);
          await sleep(300);
          if (cancelled) return;
          await typeText(step.text);
          if (cancelled) return;
          await sleep(400);
          if (cancelled) return;

          setAiDemoSending(true);
          setAiDemoThinking(true);
          await sleep(160);
          if (cancelled) return;
          setAiDemoInput("");
          setAiDemoFocus(false);
          await sleep(480);
          if (cancelled) return;

          setAiDemoNonce((n) => n + 1);
          setAiDemoView(step.view);
          setAiDemoThinking(false);
          setAiDemoSending(false);

          await sleep(2600);
          if (cancelled) return;
        }
        await sleep(700);
      }
    })();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function onLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createBrowserSupabaseClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError(err.message); setLoading(false); return; }
    showToast("Welcome back! Signing you in...");
    setTimeout(() => router.push("/"), 1000);
  }

  async function onSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (signupPassword !== signupConfirm) { setError("Passwords do not match."); return; }
    if (!agree) { setError("You must agree to the terms."); return; }
    setLoading(true);
    const supabase = createBrowserSupabaseClient();
    const { error: err } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: { data: { full_name: signupName } },
    });
    if (err) { setError(err.message); setLoading(false); return; }
    showToast("Account created! Taking you in...");
    setTimeout(() => router.push("/"), 1000);
  }

  function switchMode(target: "login" | "signup") {
    setError(null);
    setMode(target);
  }

  const revenueRange = ["Weekly", "Monthly", "Yearly", "Range"] as const;
  const revScene = REV_BAR_SCENES[revSceneIndex];

  const calendarWeeks = [
    [null, null, 1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10, 11, 12],
    [13, 14, 15, 16, 17, 18, 19],
    [20, 21, 22, 23, 24, 25, 26],
    [27, 28, 29, 30, 31, null, null],
  ];
  const spendMix = [
    { id: "a", label: "Activity", pct: 18, color: "#fbbf24" },
    { id: "b", label: "Meals", pct: 22, color: "#38bdf8" },
    { id: "c", label: "Office supplies", pct: 15, color: "#a78bfa" },
    { id: "d", label: "Rewards", pct: 12, color: "#4ade80" },
    { id: "e", label: "Internet & Tel.", pct: 14, color: "#fb923c" },
    { id: "f", label: "Other", pct: 19, color: "#64748b" },
  ] as const;
  const invoices = [
    { when: "Aug 9 · in 1 week", name: "Leonard Kim", amount: "$130.00", status: "unpaid" as const },
    { when: "Aug 12 · Paid", name: "Studio North", amount: "$2,400.00", status: "paid" as const },
    { when: "Aug 14 · Pending", name: "Cloudstack Inc.", amount: "$890.00", status: "pending" as const },
  ];

  const isLogin = mode === "login";

  return (
    <main className={`login-shell ${fontSans.className}`}>
      {/* Toast notification */}
      {toast && (
        <div className="toast toast-top-right">
          <span className="toast-dot" />
          {toast}
        </div>
      )}

      {/* ===== LEFT: Dashboard ===== */}
      <section className="dash-side">
        <div className="dash-inner">
          <div className="dash-brand">
            <MonocleMarkAnimated size={40} title="Monocle" />
            <div className="dash-brand-text">
              <span className="dash-brand-name">{PRODUCT_NAME}</span>
              <span className="dash-brand-tagline">{PRODUCT_TAGLINE}</span>
            </div>
          </div>

          <div className="dash-showcase" aria-hidden>
            <div className="glass-card glass-revenue">
              <div className="rev-head">
                <div>
                  <div className="rev-title">Revenue</div>
                  <div className="rev-amount">
                    <span className="rev-currency">$</span> 28,165
                  </div>
                </div>
                <span className="rev-pill">+ 8.3% vs 24,280 last period</span>
              </div>
              <div className="rev-segments" role="tablist">
                {revenueRange.map((r) => (
                  <span key={r} className={`rev-seg${r === "Yearly" ? " active" : ""}`} role="presentation">
                    {r}
                  </span>
                ))}
              </div>
              <div className="rev-chart-wrap">
                <div className="rev-y-axis">
                  <span>6k</span>
                  <span>4.5k</span>
                  <span>3k</span>
                  <span>1.5k</span>
                  <span>0</span>
                </div>
                <div className="rev-bars">
                  {REV_MONTH_LABELS.map((label, i) => {
                    const pct = revScene.pcts[i] ?? 40;
                    const hot = i === revScene.hotIndex;
                    return (
                      <div key={`${label}-${i}`} className="rev-bar-col">
                        <div className="rev-bar-stack">
                          {hot ? <span className="rev-bar-badge">{revScene.badge}</span> : null}
                          <div
                            className={`rev-bar${hot ? " rev-bar-hot" : " rev-bar-muted"}`}
                            style={{ height: `${pct}%` }}
                          />
                        </div>
                        {hot && revScene.foot ? <span className="rev-bar-foot">{revScene.foot}</span> : null}
                        <span className="rev-bar-mo">{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="glass-card glass-cal">
              <div className="cal-head">
                <button type="button" className="cal-nav" tabIndex={-1} aria-hidden>
                  ‹
                </button>
                <span className="cal-month">January, 2026</span>
                <button type="button" className="cal-nav" tabIndex={-1} aria-hidden>
                  ›
                </button>
              </div>
              <div className="cal-dow">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                  <span key={`${d}-${i}`}>{d}</span>
                ))}
              </div>
              <div className="cal-grid">
                {calendarWeeks.flatMap((row, ri) =>
                  row.map((cell, ci) =>
                    cell == null ? (
                      <span key={`e-${ri}-${ci}`} className="cal-cell cal-cell-empty" />
                    ) : (
                      <span
                        key={`${ri}-${ci}`}
                        className={`cal-cell${cell === 11 ? " cal-cell-today" : ""}`}
                      >
                        {cell}
                      </span>
                    ),
                  ),
                )}
              </div>
              <div className="cal-foot">
                <span className="cal-foot-amt">$1,434</span>
                <span className="cal-foot-up">
                  <span className="cal-foot-arrow">↑</span> + 12.4%
                </span>
              </div>
            </div>

            <div className="glass-card glass-ai">
              <div className="ai-head">
                <svg className="ai-sparkle" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    className="ai-sparkle-star ai-sparkle-star--lg"
                    d="M12 2l1.2 4.2L17.4 7.5l-4.2 1.2L12 12.9l-1.2-4.2L6.6 7.5l4.2-1.2L12 2z"
                    fill="currentColor"
                  />
                  <path
                    className="ai-sparkle-star ai-sparkle-star--sm"
                    d="M19 14l.6 2.1 2.1.6-2.1.6L19 19.3l-.6-2.1-2.1-.6 2.1-.6L19 14z"
                    fill="currentColor"
                  />
                </svg>
                <span>How can I help you?</span>
              </div>
              <p className="ai-summary">
                <strong>AI summary:</strong> Spend is steady week over week. Ask {PRODUCT_NAME} to drill into any category or
                compare periods — same natural language you&apos;ll use after sign-in.
              </p>
              <div className="ai-results" aria-hidden>
                {aiDemoThinking && (
                  <div className="ai-thinking">
                    <span className="ai-thinking-dot" />
                    <span className="ai-thinking-dot" />
                    <span className="ai-thinking-dot" />
                    <span className="ai-thinking-label">Building view</span>
                  </div>
                )}
                {aiDemoView === "ts" && (
                  <div key={`ts-${aiDemoNonce}`} className="agui-card agui-card-ts">
                    <div className="agui-card-head">
                      <span className="agui-card-title">Spending · last 30 days</span>
                      <span className="agui-pill">Time series</span>
                    </div>
                    <div className="agui-ts-chart">
                      <div className="agui-ts-y" aria-hidden>
                        <span>80k</span>
                        <span>40k</span>
                        <span>0</span>
                      </div>
                      <div className="agui-ts-bars">
                        {[38, 52, 45, 61, 55, 48, 72, 58, 66, 54, 49, 78].map((pct, i) => (
                          <div key={i} className="agui-ts-col">
                            <div className="agui-ts-bar-wrap">
                              <div className="agui-ts-bar" style={{ height: `${pct}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <p className={`agui-card-foot ${fontMono.className}`}>+6.2% vs prior 30d · peak mid-period</p>
                  </div>
                )}
                {aiDemoView === "count" && (
                  <div key={`count-${aiDemoNonce}`} className="agui-card agui-card-count">
                    <div className="agui-card-head">
                      <span className="agui-card-title">Payments · this month</span>
                      <span className="agui-pill agui-pill-alt">Count</span>
                    </div>
                    <div className="agui-kpi">
                      <span className="agui-kpi-num">247</span>
                      <span className="agui-kpi-sub">processed</span>
                    </div>
                    <ul className="agui-count-rows">
                      <li>
                        <span>Settled</span>
                        <span className={fontMono.className}>198</span>
                      </li>
                      <li>
                        <span>Pending</span>
                        <span className={fontMono.className}>31</span>
                      </li>
                      <li>
                        <span>Failed</span>
                        <span className={fontMono.className}>18</span>
                      </li>
                    </ul>
                  </div>
                )}
                {aiDemoView === "breakdown" && (
                  <div key={`bd-${aiDemoNonce}`} className="agui-card agui-card-breakdown">
                    <div className="agui-card-head">
                      <span className="agui-card-title">Spend by category · last quarter</span>
                      <span className="agui-pill agui-pill-amber">Breakdown</span>
                    </div>
                    <ul className="agui-hbar-list">
                      {[
                        { label: "Software", pct: 82, color: "#4ade80" },
                        { label: "Travel", pct: 58, color: "#38bdf8" },
                        { label: "Payroll", pct: 44, color: "#a78bfa" },
                        { label: "Other", pct: 26, color: "#64748b" },
                      ].map((row, rowIndex) => (
                        <li key={row.label} className="agui-hbar-row">
                          <span className="agui-hbar-label">{row.label}</span>
                          <div className="agui-hbar-track">
                            <div
                              className="agui-hbar-fill"
                              style={{
                                width: `${row.pct}%`,
                                background: row.color,
                                animationDelay: `${0.07 * rowIndex}s`,
                              }}
                            />
                          </div>
                          <span className={`agui-hbar-pct ${fontMono.className}`}>{row.pct}%</span>
                        </li>
                      ))}
                    </ul>
                    <p className={`agui-card-foot ${fontMono.className}`}>Software +4 pts vs prior quarter</p>
                  </div>
                )}
              </div>
              <div
                className={`ai-prompt${aiDemoFocus ? " ai-prompt--focus" : ""}${aiDemoSending ? " ai-prompt--send" : ""}`}
                aria-hidden
              >
                <div className="ai-prompt-text">
                  {aiDemoInput ? (
                    <>
                      {aiDemoInput}
                      {aiDemoFocus && <span className="ai-caret" />}
                    </>
                  ) : aiDemoFocus ? (
                    <span className="ai-caret" />
                  ) : (
                    <span className="ai-prompt-ph">Ask me anything…</span>
                  )}
                </div>
                <svg
                  className="ai-prompt-send"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            <div className="glass-card glass-spend">
              <div className="spend-head">Spending</div>
              <ul className="spend-count-stack">
                {spendMix.map((s) => {
                  const count = Math.max(8, Math.round(s.pct * 11.5));
                  return (
                    <li
                      key={s.id}
                      className="spend-count-card"
                      style={{
                        borderLeftColor: s.color,
                        background: `linear-gradient(90deg, ${s.color}18 0%, rgba(0, 0, 0, 0.22) 55%)`,
                        boxShadow: `inset 0 0 0 1px ${s.color}14`,
                      }}
                    >
                      <div className="spend-count-card-text">
                        <span className="spend-count-label">{s.label}</span>
                        <span className="spend-count-pct">{s.pct}% share</span>
                      </div>
                      <span className={`spend-count-num ${fontMono.className}`}>{count}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="glass-card glass-invoice">
              <div className="inv-head">
                <span>Invoices</span>
                <button type="button" className="inv-plus" tabIndex={-1} aria-hidden>
                  +
                </button>
              </div>
              <div className="inv-score-row">
                <span className="inv-score-label">Payment score</span>
                <span className="inv-score-num">76</span>
              </div>
              <div className="inv-progress">
                <div className="inv-progress-fill" style={{ width: "76%" }} />
              </div>
              <ul className="inv-list">
                {invoices.map((inv) => (
                  <li key={inv.name} className="inv-row">
                    <span className={`inv-dot inv-dot-${inv.status}`} />
                    <div className="inv-meta">
                      <span className="inv-when">{inv.when}</span>
                      <span className="inv-line">
                        {inv.name} <span className="inv-amt">{inv.amount}</span>
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
              <button type="button" className="inv-all" tabIndex={-1}>
                View all invoices →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== RIGHT: Animated Forms ===== */}
      <section className={`form-side${isLogin ? "" : " form-side--signup"}`}>
        <div className="form-side-bg" aria-hidden />
        <div className="form-side-vignette" aria-hidden />
        <div className="mobile-hero">
          <div className="mobile-hero-backdrop" aria-hidden />
          <div className="mobile-hero-logo-wrap">
            <MonocleMarkAnimated size={88} title="Monocle" />
          </div>
          <div className="mobile-hero-titles">
            <span className="mobile-hero-name">{PRODUCT_NAME}</span>
            <span className="mobile-hero-tag">{PRODUCT_TAGLINE}</span>
          </div>
        </div>
        <div className="form-scroll">

          {/* ---- Sign In ---- */}
          <div className={`panel${isLogin ? " visible" : ""}`}>
            <div className="form-panel">
              <div className="form-inner">
              <div className="badge"><span className="badge-dot" />{PRODUCT_TAGLINE}</div>
              <h1>Welcome back<br /><span className="accent">{PRODUCT_NAME}</span></h1>
              <p className={`subtitle ${fontMono.className}`}>{PRODUCT_VALUE_PROP}</p>

              <form onSubmit={onLogin} className="form form--login">
                <div className="field">
                  <label>EMAIL ADDRESS</label>
                  <div className="input-box">
                    <svg className="ic" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="3" /><path d="M2 7l10 7 10-7" /></svg>
                    <input type="email" required placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                </div>

                <div className="field">
                  <label>PASSWORD</label>
                  <div className="input-box">
                    <svg className="ic" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 118 0v4" /></svg>
                    <input type={showPassword ? "text" : "password"} required placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <button type="button" className="eye" onClick={() => setShowPassword(!showPassword)}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        {showPassword
                          ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></>
                          : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>}
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="form-row">
                  <label className="cb-label" onClick={() => setRemember(!remember)}>
                    <span className={`cb${remember ? " on" : ""}`}>
                      {remember && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>}
                    </span>
                    Remember me
                  </label>
                  <a href="#" className="forgot">Forgot password?</a>
                </div>

                {error && isLogin && <p className="err">{error}</p>}

                <button className="btn-primary" type="submit" disabled={loading}>
                  {loading ? (
                    <span className="btn-loading">
                      <span className="btn-spinner" />
                      {mode === "login" ? "Signing in..." : "Creating account..."}
                    </span>
                  ) : (
                    mode === "login" ? "Sign In →" : "Create Account →"
                  )}
                </button>
              </form>

              <p className="switch-text">
                Don&apos;t have an account?{" "}
                <button type="button" className="switch-link" onClick={() => switchMode("signup")}>Create one free →</button>
              </p>
              </div>
            </div>
          </div>

          {/* ---- Sign Up ---- */}
          <div className={`panel${!isLogin ? " visible" : ""}`}>
            <div className="form-panel">
              <div className="form-inner">
              <div className="badge"><span className="badge-dot" />{PRODUCT_NAME}</div>
              <h1>Create your<br /><span className="accent">Account</span></h1>
              <p className={`subtitle ${fontMono.className}`}>
                {PRODUCT_VALUE_PROP} Create your account to try it on your own data.
              </p>

              <form onSubmit={onSignup} className="form form--signup">
                <div className="field">
                  <label>FULL NAME</label>
                  <div className="input-box">
                    <svg className="ic" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    <input type="text" required placeholder="Enter your full name" value={signupName} onChange={(e) => setSignupName(e.target.value)} />
                  </div>
                </div>

                <div className="field">
                  <label>EMAIL ADDRESS</label>
                  <div className="input-box">
                    <svg className="ic" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="3" /><path d="M2 7l10 7 10-7" /></svg>
                    <input type="email" required placeholder="Enter your email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} />
                  </div>
                </div>

                <div className="row2">
                  <div className="field">
                    <label>PASSWORD</label>
                    <div className="input-box">
                      <svg className="ic" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 118 0v4" /></svg>
                      <input type={showSignupPw ? "text" : "password"} required placeholder="Create password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} />
                      <button type="button" className="eye" onClick={() => setShowSignupPw(!showSignupPw)}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          {showSignupPw
                            ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></>
                            : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>}
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="field">
                    <label>CONFIRM PASSWORD</label>
                    <div className="input-box">
                      <svg className="ic" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 118 0v4" /></svg>
                      <input type={showSignupConfirm ? "text" : "password"} required placeholder="Confirm password" value={signupConfirm} onChange={(e) => setSignupConfirm(e.target.value)} />
                      <button type="button" className="eye" onClick={() => setShowSignupConfirm(!showSignupConfirm)}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          {showSignupConfirm
                            ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></>
                            : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>}
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                <label className="cb-label" onClick={() => setAgree(!agree)}>
                  <span className={`cb${agree ? " on" : ""}`}>
                    {agree && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>}
                  </span>
                  I agree to the <span className="tlink">Terms of Service</span> &amp; <span className="tlink">Privacy Policy</span>
                </label>

                {error && !isLogin && <p className="err">{error}</p>}

                <button className="btn-primary" type="submit" disabled={loading}>
                  {loading ? (
                    <span className="btn-loading">
                      <span className="btn-spinner" />
                      {mode === "login" ? "Signing in..." : "Creating account..."}
                    </span>
                  ) : (
                    mode === "login" ? "Sign In →" : "Create Account →"
                  )}
                </button>
              </form>

              <p className="switch-text">
                Already have an account?{" "}
                <button type="button" className="switch-link" onClick={() => switchMode("login")}>Sign in →</button>
              </p>
              </div>
            </div>
          </div>

        </div>
      </section>


      {/* Fullscreen loader overlay */}
      {loading && (
        <div className="loader-overlay">
          <div className="loader-spinner" />
          <p className="loader-text">{mode === "login" ? "Signing in..." : "Creating account..."}</p>
        </div>
      )}

      <style jsx>{`
        .toast {
          position: fixed;
          top: 22px;
          right: 22px;
          z-index: 10000;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 18px;
          max-width: min(380px, calc(100vw - 40px));
          font-size: 13px;
          font-weight: 600;
          color: var(--oa-text);
          background: linear-gradient(165deg, rgba(24, 24, 27, 0.98) 0%, rgba(9, 9, 11, 0.99) 100%);
          border: 1px solid rgba(74, 222, 128, 0.28);
          border-radius: 14px;
          box-shadow:
            0 0 0 1px rgba(0, 0, 0, 0.4),
            0 20px 50px -18px rgba(0, 0, 0, 0.65),
            0 0 28px -12px rgba(74, 222, 128, 0.35);
          backdrop-filter: blur(14px);
          animation: toast-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        .toast-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
          background: var(--neon);
          box-shadow: 0 0 14px rgba(74, 222, 128, 0.85);
        }

        @keyframes toast-in {
          from {
            opacity: 0;
            transform: translateY(-12px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .toast {
            animation: none;
          }
        }

        .loader-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: radial-gradient(120% 100% at 50% 0%, var(--oa-bg-top) 0%, var(--oa-bg-mid) 45%, var(--oa-bg-bot) 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
        }

        .loader-spinner {
          width: 44px;
          height: 44px;
          border: 3px solid rgba(63, 63, 70, 0.75);
          border-top-color: var(--neon);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        .loader-text {
          color: rgba(161, 161, 170, 0.75);
          font-size: 14px;
          font-weight: 500;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .login-shell {
          /* Align with OpeningAnimation (.oa-overlay / .oa-dash) */
          --oa-bg-top: #0f1218;
          --oa-bg-mid: #09090b;
          --oa-bg-bot: #050506;
          --oa-surface: rgba(24, 24, 27, 0.98);
          --oa-surface-deep: rgba(9, 9, 11, 0.99);
          --oa-border-green: rgba(74, 222, 128, 0.28);
          --oa-border-zinc: rgba(63, 63, 70, 0.85);
          --oa-text: #fafafa;
          --oa-muted: rgba(161, 161, 170, 0.9);
          --bg-deep: var(--oa-bg-mid);
          --bg-elevated: #18181b;
          --border-subtle: var(--oa-border-zinc);
          --neon: #4ade80;
          --neon-dim: rgba(74, 222, 128, 0.14);
          --neon-mid: #22c55e;
          --neon-dark: #15803d;
          --amber: #fbbf24;
          --text-muted: #a1a1aa;
          position: fixed;
          inset: 0;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          overflow: hidden;
          color-scheme: dark;
        }

        /* ===== LEFT: dashboard preview — OpeningAnimation palette ===== */
        .dash-side {
          position: relative;
          background: radial-gradient(120% 100% at 50% 0%, var(--oa-bg-top) 0%, var(--oa-bg-mid) 45%, var(--oa-bg-bot) 100%);
          padding: 16px 18px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }

        .dash-side::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(ellipse 90% 70% at 50% 20%, rgba(74, 222, 128, 0.14) 0%, transparent 55%),
            radial-gradient(ellipse 55% 45% at 85% 75%, rgba(34, 197, 94, 0.06) 0%, transparent 45%),
            radial-gradient(ellipse 50% 40% at 8% 60%, rgba(52, 211, 153, 0.05) 0%, transparent 40%);
        }

        .dash-side::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.35;
          background-image:
            linear-gradient(rgba(74, 222, 128, 0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(74, 222, 128, 0.07) 1px, transparent 1px);
          background-size: 48px 48px;
          animation: login-grid-drift 18s linear infinite;
        }

        @keyframes login-grid-drift {
          to {
            background-position: 48px 48px;
          }
        }

        .dash-inner {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 0;
          gap: 10px;
          justify-content: flex-start;
        }

        .dash-brand { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .dash-brand-text { display: flex; flex-direction: column; gap: 1px; }
        .dash-brand-name { font-size: 22px; font-weight: 700; color: var(--oa-text); font-style: italic; line-height: 1.1; }
        .dash-brand-tagline { font-size: 10px; font-weight: 500; color: var(--oa-muted); letter-spacing: 0.04em; }

        /* Glass dashboard tiles (financial UI reference) */
        .dash-showcase {
          flex: 1;
          min-height: 0;
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.52fr) minmax(0, 0.95fr);
          grid-template-rows: auto minmax(140px, 1fr);
          gap: 10px;
          align-content: start;
        }

        .glass-card {
          border-radius: 16px;
          padding: 12px 14px;
          background: linear-gradient(165deg, var(--oa-surface) 0%, var(--oa-surface-deep) 100%);
          border: 1px solid var(--oa-border-green);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.06),
            0 0 0 1px rgba(0, 0, 0, 0.4),
            0 0 32px rgba(74, 222, 128, 0.06),
            0 16px 48px -24px rgba(0, 0, 0, 0.55);
          backdrop-filter: blur(12px);
          min-height: 0;
        }

        @supports not (backdrop-filter: blur(1px)) {
          .glass-card {
            background: #18181b;
          }
        }

        .glass-revenue { grid-column: 1 / 3; grid-row: 1; }
        .glass-cal { grid-column: 3; grid-row: 1; }
        .glass-ai {
          grid-column: 1;
          grid-row: 2;
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-height: 0;
        }
        .glass-spend {
          grid-column: 2;
          grid-row: 2;
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-height: 0;
        }
        .glass-invoice { grid-column: 3; grid-row: 2; display: flex; flex-direction: column; gap: 8px; }

        .rev-head {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 8px;
        }

        .rev-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--oa-text);
        }

        .rev-amount {
          font-size: clamp(22px, 2.4vw, 28px);
          font-weight: 800;
          color: var(--oa-text);
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.02em;
          line-height: 1.1;
          margin-top: 2px;
        }

        .rev-currency {
          font-size: 0.65em;
          font-weight: 700;
          color: var(--oa-muted);
          margin-right: 2px;
        }

        .rev-pill {
          font-size: 10px;
          font-weight: 600;
          color: #052e16;
          background: linear-gradient(135deg, #4ade80, #22c55e);
          padding: 5px 10px;
          border-radius: 999px;
          white-space: nowrap;
          box-shadow: 0 0 16px -4px rgba(74, 222, 128, 0.5);
        }

        .rev-segments {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-bottom: 10px;
        }

        .rev-seg {
          font-size: 10px;
          font-weight: 600;
          padding: 5px 10px;
          border-radius: 10px;
          color: #8b95a8;
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .rev-seg.active {
          color: #0f172a;
          background: #f1f5f9;
          border-color: #f1f5f9;
        }

        .rev-chart-wrap {
          display: flex;
          gap: 6px;
          align-items: stretch;
          min-height: 100px;
        }

        .rev-y-axis {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          font-size: 9px;
          font-weight: 500;
          color: #5c6577;
          padding: 2px 0 18px;
          flex-shrink: 0;
          width: 26px;
          text-align: right;
        }

        .rev-bars {
          flex: 1;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 3px;
          min-width: 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          padding-bottom: 2px;
        }

        .rev-bar-col {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          height: 100%;
        }

        .rev-bar-stack {
          flex: 1;
          width: 100%;
          max-width: 28px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          gap: 4px;
          min-height: 72px;
        }

        .rev-bar-badge {
          font-size: 8px;
          font-weight: 700;
          color: #052e16;
          background: linear-gradient(135deg, #bbf7d0, var(--neon) 55%, var(--neon-mid));
          padding: 2px 5px;
          border-radius: 6px;
          white-space: nowrap;
          box-shadow: 0 0 12px rgba(74, 222, 128, 0.55);
        }

        .rev-bar {
          width: 100%;
          border-radius: 6px 6px 2px 2px;
          min-height: 4px;
          flex-shrink: 0;
          align-self: stretch;
          transition: height 0.75s cubic-bezier(0.34, 1.15, 0.64, 1), filter 0.35s ease, box-shadow 0.35s ease;
        }

        .rev-bar-muted {
          background: repeating-linear-gradient(
            -40deg,
            rgba(55, 60, 72, 0.95) 0px,
            rgba(55, 60, 72, 0.95) 3px,
            rgba(38, 42, 52, 0.98) 3px,
            rgba(38, 42, 52, 0.98) 7px
          );
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
        }

        .rev-bar-hot {
          background: linear-gradient(180deg, var(--neon) 0%, var(--neon-dark) 100%);
          box-shadow: 0 0 14px rgba(74, 222, 128, 0.35);
        }

        .rev-bar-foot {
          font-size: 8px;
          font-weight: 700;
          color: #94a3b8;
          font-variant-numeric: tabular-nums;
        }

        .rev-bar-mo {
          font-size: 9px;
          font-weight: 600;
          color: #6b7280;
        }

        .cal-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .cal-month {
          font-size: 11px;
          font-weight: 700;
          color: #e2e8f0;
        }

        .cal-nav {
          width: 26px;
          height: 26px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(0, 0, 0, 0.2);
          color: #94a3b8;
          font-size: 14px;
          line-height: 1;
          cursor: default;
        }

        .cal-dow {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
          margin-bottom: 4px;
          font-size: 9px;
          font-weight: 600;
          color: #5c6577;
          text-align: center;
        }

        .cal-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 3px;
          margin-bottom: 10px;
        }

        .cal-cell {
          aspect-ratio: 1;
          max-height: 26px;
          display: grid;
          place-items: center;
          font-size: 10px;
          font-weight: 600;
          color: #cbd5e1;
          border-radius: 8px;
        }

        .cal-cell-empty {
          visibility: hidden;
        }

        .cal-cell-today {
          background: var(--neon);
          color: var(--oa-bg-bot);
          box-shadow: 0 0 12px rgba(74, 222, 128, 0.55);
        }

        .cal-foot {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .cal-foot-amt {
          font-size: 15px;
          font-weight: 800;
          color: #fff;
          font-variant-numeric: tabular-nums;
        }

        .cal-foot-up {
          font-size: 11px;
          font-weight: 600;
          color: #4ade80;
        }

        .cal-foot-arrow {
          font-size: 10px;
          margin-right: 2px;
        }

        .ai-head {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 700;
          color: #f1f5f9;
        }

        @keyframes ai-sparkle-float {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }
          33% {
            transform: translateY(-1.5px) rotate(-2deg);
          }
          66% {
            transform: translateY(0.5px) rotate(2deg);
          }
        }

        @keyframes ai-sparkle-twinkle {
          0%,
          100% {
            opacity: 0.42;
            transform: scale(0.86);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .ai-sparkle {
          color: #86efac;
          flex-shrink: 0;
          overflow: visible;
          filter: drop-shadow(0 0 6px rgba(74, 222, 128, 0.45));
          animation: ai-sparkle-float 4.5s ease-in-out infinite;
        }

        .ai-sparkle-star {
          transform-box: fill-box;
          transform-origin: center;
        }

        .ai-sparkle-star--lg {
          animation: ai-sparkle-twinkle 2.6s ease-in-out infinite;
        }

        .ai-sparkle-star--sm {
          animation: ai-sparkle-twinkle 2.6s ease-in-out infinite;
          animation-delay: -1.3s;
        }

        .ai-summary {
          margin: 0;
          font-size: 10px;
          line-height: 1.5;
          color: #9ca3af;
          flex: 0 0 auto;
        }

        .ai-results {
          flex: 1 1 auto;
          min-height: 72px;
          max-height: 200px;
          display: flex;
          flex-direction: column;
          gap: 5px;
          overflow-x: hidden;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(74, 222, 128, 0.25) transparent;
        }

        .ai-results::-webkit-scrollbar {
          width: 4px;
        }

        .ai-results::-webkit-scrollbar-thumb {
          background: rgba(74, 222, 128, 0.28);
          border-radius: 4px;
        }

        .ai-thinking {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 8px 10px;
          border-radius: 10px;
          background: rgba(0, 0, 0, 0.28);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .ai-thinking-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #86efac;
          animation: ai-dot-pulse 0.9s ease-in-out infinite;
        }

        .ai-thinking-dot:nth-child(2) {
          animation-delay: 0.15s;
        }

        .ai-thinking-dot:nth-child(3) {
          animation-delay: 0.3s;
        }

        .ai-thinking-label {
          margin-left: 4px;
          font-size: 10px;
          font-weight: 600;
          color: #94a3b8;
        }

        @keyframes ai-dot-pulse {
          0%,
          100% {
            opacity: 0.35;
            transform: scale(0.85);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes agui-card-in {
          from {
            opacity: 0;
            transform: translateY(5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes agui-bar-in {
          from {
            transform: scaleY(0);
          }
          to {
            transform: scaleY(1);
          }
        }

        .agui-card {
          border-radius: 10px;
          padding: 8px 9px;
          background: rgba(0, 0, 0, 0.32);
          border: 1px solid rgba(255, 255, 255, 0.07);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
          animation: agui-card-in 0.42s cubic-bezier(0.22, 1, 0.36, 1) backwards;
          flex-shrink: 0;
        }

        .agui-card-ts {
          flex: 0 0 auto;
        }

        .agui-card-count {
          flex: 0 0 auto;
          animation-delay: 0.05s;
        }

        .agui-card-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          margin-bottom: 6px;
        }

        .agui-card-title {
          font-size: 9px;
          font-weight: 700;
          color: #e2e8f0;
          letter-spacing: 0.02em;
        }

        .agui-pill {
          font-size: 8px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          padding: 2px 6px;
          border-radius: 999px;
          color: #052e16;
          background: linear-gradient(135deg, #bbf7d0, var(--neon));
          flex-shrink: 0;
        }

        .agui-pill-alt {
          background: rgba(56, 189, 248, 0.25);
          color: #7dd3fc;
          border: 1px solid rgba(56, 189, 248, 0.35);
        }

        .agui-pill-amber {
          background: rgba(251, 191, 36, 0.2);
          color: #fcd34d;
          border: 1px solid rgba(251, 191, 36, 0.35);
        }

        .agui-card-breakdown {
          flex: 0 0 auto;
        }

        .agui-hbar-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .agui-hbar-row {
          display: grid;
          grid-template-columns: 52px 1fr 28px;
          align-items: center;
          gap: 6px;
          font-size: 8px;
          font-weight: 600;
        }

        .agui-hbar-label {
          color: #94a3b8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .agui-hbar-track {
          height: 6px;
          border-radius: 4px;
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.06);
          overflow: hidden;
        }

        .agui-hbar-fill {
          height: 100%;
          border-radius: 3px;
          transform-origin: left center;
          transform: scaleX(0);
          animation: agui-hbar-grow 0.62s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          box-shadow: 0 0 6px rgba(0, 0, 0, 0.35);
        }

        .agui-hbar-pct {
          text-align: right;
          color: #cbd5e1;
          font-size: 8px;
          font-weight: 700;
        }

        @keyframes agui-hbar-grow {
          to {
            transform: scaleX(1);
          }
        }

        .agui-ts-chart {
          display: flex;
          gap: 4px;
          align-items: stretch;
          height: 56px;
        }

        .agui-ts-y {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          font-size: 7px;
          font-weight: 600;
          color: #5c6577;
          width: 22px;
          flex-shrink: 0;
          text-align: right;
          padding-bottom: 2px;
        }

        .agui-ts-bars {
          flex: 1;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 2px;
          min-width: 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          padding-bottom: 1px;
        }

        .agui-ts-col {
          flex: 1;
          min-width: 0;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
        }

        .agui-ts-bar-wrap {
          flex: 1;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          min-height: 0;
        }

        .agui-ts-bar {
          width: 100%;
          max-width: 7px;
          border-radius: 3px 3px 1px 1px;
          background: linear-gradient(180deg, var(--neon) 0%, var(--neon-dark) 100%);
          box-shadow: 0 0 8px rgba(74, 222, 128, 0.25);
          transform-origin: bottom center;
          animation: agui-bar-in 0.55s cubic-bezier(0.34, 1.15, 0.64, 1) backwards;
        }

        .agui-ts-col:nth-child(1) .agui-ts-bar {
          animation-delay: 0.04s;
        }
        .agui-ts-col:nth-child(2) .agui-ts-bar {
          animation-delay: 0.07s;
        }
        .agui-ts-col:nth-child(3) .agui-ts-bar {
          animation-delay: 0.1s;
        }
        .agui-ts-col:nth-child(4) .agui-ts-bar {
          animation-delay: 0.13s;
        }
        .agui-ts-col:nth-child(5) .agui-ts-bar {
          animation-delay: 0.16s;
        }
        .agui-ts-col:nth-child(6) .agui-ts-bar {
          animation-delay: 0.19s;
        }
        .agui-ts-col:nth-child(7) .agui-ts-bar {
          animation-delay: 0.22s;
        }
        .agui-ts-col:nth-child(8) .agui-ts-bar {
          animation-delay: 0.25s;
        }
        .agui-ts-col:nth-child(9) .agui-ts-bar {
          animation-delay: 0.28s;
        }
        .agui-ts-col:nth-child(10) .agui-ts-bar {
          animation-delay: 0.31s;
        }
        .agui-ts-col:nth-child(11) .agui-ts-bar {
          animation-delay: 0.34s;
        }
        .agui-ts-col:nth-child(12) .agui-ts-bar {
          animation-delay: 0.37s;
        }

        .agui-card-foot {
          margin: 5px 0 0;
          font-size: 8px;
          line-height: 1.35;
          color: #6b7280;
        }

        .agui-kpi {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin-bottom: 6px;
        }

        .agui-kpi-num {
          font-size: 22px;
          font-weight: 800;
          color: #f8fafc;
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.03em;
          line-height: 1;
        }

        .agui-kpi-sub {
          font-size: 9px;
          font-weight: 600;
          color: #64748b;
        }

        .agui-count-rows {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .agui-count-rows li {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 9px;
          font-weight: 600;
          color: #94a3b8;
          padding: 4px 6px;
          border-radius: 6px;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .agui-count-rows li span:last-child {
          color: #e2e8f0;
          font-weight: 700;
        }

        .ai-summary strong {
          color: #cbd5e1;
        }

        .ai-prompt {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.28);
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: #5c6577;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
          flex-shrink: 0;
          margin-top: auto;
        }

        .ai-prompt--focus {
          border-color: rgba(74, 222, 128, 0.35);
          box-shadow: 0 0 0 1px rgba(74, 222, 128, 0.12);
          background: rgba(0, 0, 0, 0.38);
        }

        .ai-prompt--send .ai-prompt-send {
          color: #4ade80;
          opacity: 1;
          animation: ai-send-pulse 0.45s ease;
        }

        @keyframes ai-send-pulse {
          0%,
          100% {
            transform: scale(1);
          }
          40% {
            transform: scale(1.12);
          }
        }

        .ai-prompt-text {
          flex: 1;
          min-width: 0;
          font-size: 11px;
          line-height: 1.35;
          color: #cbd5e1;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0;
        }

        .ai-prompt-ph {
          font-size: 11px;
        }

        .ai-caret {
          display: inline-block;
          width: 2px;
          height: 12px;
          margin-left: 1px;
          background: #4ade80;
          border-radius: 1px;
          animation: ai-caret-blink 1s step-end infinite;
          vertical-align: middle;
        }

        @keyframes ai-caret-blink {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0;
          }
        }

        .ai-prompt-send {
          flex-shrink: 0;
          opacity: 0.5;
          transition: color 0.2s ease, opacity 0.2s ease;
        }

        .spend-head {
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .spend-count-stack {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 5px;
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.12) transparent;
        }

        .spend-count-stack::-webkit-scrollbar {
          width: 3px;
        }

        .spend-count-stack::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 3px;
        }

        .spend-count-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 6px 8px 6px 9px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-left: 3px solid;
          flex-shrink: 0;
        }

        .spend-count-card-text {
          display: flex;
          flex-direction: column;
          gap: 1px;
          min-width: 0;
        }

        .spend-count-label {
          font-size: 9px;
          font-weight: 600;
          color: #e2e8f0;
          line-height: 1.2;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .spend-count-pct {
          font-size: 8px;
          font-weight: 500;
          color: #64748b;
        }

        .spend-count-num {
          font-size: 15px;
          font-weight: 800;
          color: #f8fafc;
          font-variant-numeric: tabular-nums;
          line-height: 1;
          flex-shrink: 0;
        }

        .inv-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 13px;
          font-weight: 700;
          color: #f1f5f9;
        }

        .inv-plus {
          width: 28px;
          height: 28px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          color: #e2e8f0;
          font-size: 18px;
          line-height: 1;
          cursor: default;
        }

        .inv-score-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          font-size: 10px;
          color: #8b95a8;
        }

        .inv-score-num {
          font-size: 18px;
          font-weight: 800;
          color: #fff;
        }

        .inv-progress {
          height: 6px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.08);
          overflow: hidden;
        }

        .inv-progress-fill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #eab308, #fbbf24);
          box-shadow: 0 0 12px rgba(251, 191, 36, 0.35);
        }

        .inv-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
          min-height: 0;
        }

        .inv-row {
          display: flex;
          gap: 8px;
          align-items: flex-start;
        }

        .inv-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-top: 4px;
          flex-shrink: 0;
        }

        .inv-dot-unpaid {
          background: #f87171;
          box-shadow: 0 0 8px rgba(248, 113, 113, 0.45);
        }

        .inv-dot-paid {
          background: #4ade80;
          box-shadow: 0 0 8px rgba(74, 222, 128, 0.35);
        }

        .inv-dot-pending {
          background: #fb923c;
          box-shadow: 0 0 8px rgba(251, 146, 60, 0.35);
        }

        .inv-meta {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .inv-when {
          font-size: 9px;
          font-weight: 600;
          color: #6b7280;
        }

        .inv-line {
          font-size: 10px;
          font-weight: 600;
          color: #e2e8f0;
        }

        .inv-amt {
          font-weight: 800;
          color: #fff;
          font-variant-numeric: tabular-nums;
        }

        .inv-all {
          align-self: flex-start;
          margin-top: auto;
          padding: 0;
          border: none;
          background: none;
          font-size: 10px;
          font-weight: 600;
          color: var(--neon);
          cursor: default;
          font-family: inherit;
        }

        .inv-all:hover {
          text-decoration: underline;
        }

        @media (prefers-reduced-motion: reduce) {
          .rev-bar {
            transition: none !important;
          }
          .dash-side::after {
            animation: none;
          }
          .ai-thinking-dot {
            animation: none !important;
            opacity: 0.85;
          }
          .agui-card {
            animation: none !important;
          }
          .agui-ts-bar {
            animation: none !important;
            transform: scaleY(1) !important;
          }
          .agui-hbar-fill {
            animation: none !important;
            transform: scaleX(1) !important;
          }
          .ai-caret {
            animation: none !important;
            opacity: 1;
          }
          .ai-prompt--send .ai-prompt-send {
            animation: none !important;
          }
          .ai-sparkle,
          .ai-sparkle-star {
            animation: none !important;
          }
          .ai-sparkle {
            transform: none !important;
          }
          .ai-sparkle-star {
            opacity: 0.92;
            transform: none !important;
          }
        }

        /* ===== RIGHT: Form column — layered background + glass card ===== */
        .form-side {
          position: relative;
          overflow: hidden;
          min-width: 0;
          background: radial-gradient(120% 100% at 50% 0%, var(--oa-bg-top) 0%, var(--oa-bg-mid) 45%, var(--oa-bg-bot) 100%);
        }

        .form-side-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(ellipse 90% 70% at 50% 20%, rgba(74, 222, 128, 0.14) 0%, transparent 55%),
            radial-gradient(ellipse 55% 45% at 85% 75%, rgba(34, 197, 94, 0.06) 0%, transparent 45%),
            radial-gradient(ellipse 50% 40% at 8% 60%, rgba(52, 211, 153, 0.05) 0%, transparent 40%);
        }

        .form-side-bg::after {
          content: "";
          position: absolute;
          inset: 0;
          opacity: 0.35;
          background-image:
            linear-gradient(rgba(74, 222, 128, 0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(74, 222, 128, 0.07) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: linear-gradient(180deg, transparent 0%, black 8%, black 92%, transparent 100%);
          animation: login-grid-drift 18s linear infinite;
        }

        .form-side-vignette {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(ellipse 85% 65% at 50% 45%, transparent 42%, rgba(0, 0, 0, 0.35) 100%);
          z-index: 0;
        }

        /* Mobile-only hero (top); hidden on desktop — shown in @media max-width 900px */
        .mobile-hero {
          display: none;
        }

        .form-scroll {
          width: 100%;
          height: 100%;
          min-height: 100%;
          overflow-y: auto;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(14px, 2.5vw, 28px);
          box-sizing: border-box;
          position: relative;
          z-index: 1;
          flex: 1;
        }

        .panel {
          position: absolute;
          width: calc(100% - 48px);
          max-width: 480px;
          opacity: 0;
          transform: translate3d(0, 12px, 0) scale(0.99);
          transform-origin: center center;
          transition: opacity 0.32s ease, transform 0.38s cubic-bezier(0.22, 1, 0.36, 1);
          pointer-events: none;
          -webkit-tap-highlight-color: transparent;
        }

        .panel.visible {
          opacity: 1;
          transform: translate3d(0, 0, 0) scale(1);
          pointer-events: auto;
          position: relative;
          width: 100%;
        }

        .form-panel {
          position: relative;
          width: 100%;
          max-width: 420px;
          min-width: 0;
          padding: clamp(20px, 2.8vw, 28px) clamp(20px, 2.5vw, 26px);
          border-radius: 18px;
          background: linear-gradient(
            168deg,
            rgba(30, 30, 34, 0.92) 0%,
            rgba(12, 12, 14, 0.96) 100%
          );
          border: 1px solid rgba(255, 255, 255, 0.07);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.05),
            0 0 0 1px rgba(0, 0, 0, 0.5),
            0 20px 50px -20px rgba(0, 0, 0, 0.7),
            0 0 80px -36px rgba(74, 222, 128, 0.07);
          backdrop-filter: blur(14px);
        }

        .form-panel::before {
          content: "";
          position: absolute;
          top: 0;
          left: 18px;
          right: 18px;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.09) 45%,
            rgba(255, 255, 255, 0.04) 55%,
            transparent
          );
          border-radius: 1px;
          pointer-events: none;
        }

        @supports not (backdrop-filter: blur(1px)) {
          .form-panel {
            background: #18181b;
          }
        }

        /* ===== SHARED FORM STYLES ===== */
        .form-inner {
          width: 100%;
          min-width: 0;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 5px 14px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.09);
          background: rgba(255, 255, 255, 0.03);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          color: rgba(161, 161, 170, 0.95);
          margin-bottom: 14px;
        }

        .badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #4ade80;
          box-shadow: 0 0 8px rgba(74, 222, 128, 0.55);
          animation: badge-pulse 2s ease-in-out infinite;
        }

        @keyframes badge-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.75; transform: scale(0.92); }
        }

        @media (prefers-reduced-motion: reduce) {
          .badge-dot { animation: none; }
          .form-side-bg::after {
            animation: none;
          }
          .panel {
            transition: opacity 0.15s ease !important;
            transform: none !important;
          }
          .panel.visible {
            transform: none !important;
          }
        }

        h1 {
          margin: 0 0 5px;
          font-size: clamp(24px, 2.85vw, 34px);
          font-weight: 800;
          color: var(--oa-text);
          line-height: 1.12;
          letter-spacing: -0.02em;
        }

        .accent { color: #4ade80; font-style: italic; }

        .subtitle {
          margin: 0 0 16px;
          font-size: 13px;
          color: var(--oa-muted);
          line-height: 1.5;
          max-width: 44ch;
        }

        .form {
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-width: 0;
        }

        .form--signup {
          gap: 11px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 5px;
          min-width: 0;
        }

        .field label {
          font-size: 11px;
          font-weight: 600;
          color: rgba(161, 161, 170, 0.85);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .row2 {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 11px;
          min-width: 0;
        }

        .input-box {
          display: flex;
          align-items: center;
          height: 48px;
          border-radius: 11px;
          border: 1px solid var(--oa-border-zinc);
          background: rgba(24, 24, 27, 0.85);
          padding: 0 14px;
          gap: 10px;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
          width: 100%;
          box-sizing: border-box;
        }

        .input-box:hover {
          border-color: rgba(82, 82, 91, 0.95);
          background: rgba(24, 24, 27, 0.95);
        }

        .input-box:focus-within {
          border-color: rgba(74, 222, 128, 0.55);
          box-shadow:
            0 0 0 3px rgba(74, 222, 128, 0.12),
            0 12px 28px -12px rgba(0, 0, 0, 0.35);
        }

        .ic {
          flex-shrink: 0;
          color: rgba(161, 161, 170, 0.55);
          opacity: 0.95;
          transition: color 0.2s ease, opacity 0.2s ease;
        }

        .input-box:focus-within .ic {
          color: #86efac;
        }

        .input-box .eye svg {
          color: #64748b;
          transition: color 0.2s ease;
        }

        .input-box:focus-within .eye svg {
          color: #94a3b8;
        }

        .input-box input {
          flex: 1;
          min-width: 0;
          height: 100%;
          border: none;
          background: transparent;
          color: var(--oa-text);
          font-size: 14px;
          outline: none;
        }

        .input-box input::placeholder { color: rgba(161, 161, 170, 0.55); }

        .input-box input:-webkit-autofill,
        .input-box input:-webkit-autofill:focus {
          -webkit-text-fill-color: var(--oa-text);
          -webkit-box-shadow: 0 0 0 1000px #18181b inset;
          transition: background-color 5000s ease-in-out 0s;
        }

        .eye {
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px;
          display: grid;
          place-items: center;
          opacity: 0.45;
          transition: opacity 0.2s, color 0.2s;
          flex-shrink: 0;
          border-radius: 8px;
        }

        .eye:hover { opacity: 1; background: rgba(74, 222, 128, 0.08); }

        .form-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 1px;
        }

        .cb-label {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: var(--oa-muted);
          cursor: pointer;
          user-select: none;
        }

        .cb {
          width: 20px;
          height: 20px;
          border-radius: 6px;
          border: 1px solid var(--oa-border-zinc);
          background: rgba(24, 24, 27, 0.9);
          display: grid;
          place-items: center;
          transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
          flex-shrink: 0;
        }

        .cb.on {
          background: linear-gradient(135deg, #22c55e, #4ade80);
          border-color: transparent;
          box-shadow: 0 0 12px rgba(74, 222, 128, 0.35);
        }

        .forgot { font-size: 13px; color: #86efac; text-decoration: none; font-weight: 500; }
        .forgot:hover { text-decoration: underline; color: #4ade80; }

        .tlink { color: #4ade80; font-weight: 500; cursor: pointer; }
        .tlink:hover { text-decoration: underline; }

        .err {
          margin: 0;
          padding: 10px 12px;
          border-radius: 10px;
          background: rgba(248, 113, 113, 0.08);
          border: 1px solid rgba(248, 113, 113, 0.25);
          color: #fca5a5;
          font-size: 13px;
        }

        .btn-primary {
          height: 48px;
          border: none;
          border-radius: 12px;
          background: var(--neon);
          color: var(--oa-bg-bot);
          font-size: 15px;
          font-weight: 800;
          letter-spacing: 0.03em;
          cursor: pointer;
          margin-top: 2px;
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.35) inset,
            0 0 0 1px rgba(255, 255, 255, 0.06) inset,
            0 3px 12px -4px rgba(74, 222, 128, 0.28),
            0 0 16px -10px rgba(74, 222, 128, 0.18);
          transition: transform 0.15s ease, box-shadow 0.2s ease, opacity 0.2s, filter 0.2s;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          filter: brightness(1.05);
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.4) inset,
            0 0 0 1px rgba(255, 255, 255, 0.08) inset,
            0 5px 18px -6px rgba(74, 222, 128, 0.36),
            0 0 22px -10px rgba(74, 222, 128, 0.24);
        }

        .btn-primary:active:not(:disabled) {
          transform: translateY(1px) scale(0.99);
        }

        .btn-primary:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

        @keyframes mobile-fade-up {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes mobile-ambient-shift {
          0%,
          100% {
            opacity: 0.35;
          }
          50% {
            opacity: 0.48;
          }
        }

        .switch-text {
          margin-top: 14px;
          text-align: center;
          font-size: 13px;
          color: rgba(161, 161, 170, 0.65);
        }

        .switch-link {
          background: none;
          border: none;
          color: #4ade80;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          padding: 0;
          font-family: inherit;
        }

        .switch-link:hover { text-decoration: underline; color: #86efac; }

        /* ===== RESPONSIVE — mobile: strict viewport box, no scroll ===== */
        @media (max-width: 900px) {
          .login-shell {
            grid-template-columns: 1fr;
            width: 100%;
            max-width: 100%;
            height: 100%;
            max-height: 100dvh;
            overflow-x: hidden;
            overflow-y: hidden;
            overscroll-behavior: none;
            touch-action: manipulation;
          }

          .dash-side { display: none; }

          .form-side {
            display: flex;
            flex-direction: column;
            height: 100%;
            max-height: 100dvh;
            min-height: 0;
            overflow: hidden;
          }

          /* Top: calm hero — logo + wordmark only */
          .mobile-hero {
            display: flex;
            position: relative;
            z-index: 2;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            flex: 1 1 0;
            min-height: 0;
            max-height: 38vh;
            padding: max(12px, env(safe-area-inset-top, 0px)) 24px 16px;
            gap: 16px;
            animation: mobile-fade-up 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
          }

          .mobile-hero-backdrop {
            position: absolute;
            left: 50%;
            top: 44%;
            transform: translate(-50%, -50%);
            width: min(240px, 70vw);
            height: min(240px, 70vw);
            border-radius: 50%;
            background: radial-gradient(
              circle at 50% 45%,
              rgba(74, 222, 128, 0.12) 0%,
              rgba(74, 222, 128, 0.03) 42%,
              transparent 68%
            );
            pointer-events: none;
          }

          .mobile-hero-logo-wrap {
            position: relative;
            z-index: 1;
          }

          .mobile-hero-logo-wrap .monocle-mark-svg {
            width: 88px !important;
            height: 88px !important;
            filter: drop-shadow(0 8px 32px rgba(74, 222, 128, 0.2));
          }

          .mobile-hero-titles {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            text-align: center;
            position: relative;
            z-index: 1;
            max-width: 280px;
          }

          .mobile-hero-name {
            font-size: 26px;
            font-weight: 700;
            font-style: normal;
            color: var(--oa-text);
            letter-spacing: -0.03em;
            line-height: 1.05;
          }

          .mobile-hero-tag {
            font-size: 12px;
            font-weight: 500;
            color: rgba(161, 161, 170, 0.92);
            letter-spacing: 0.02em;
            line-height: 1.35;
          }

          /* Bottom: form sheet */
          .form-scroll {
            position: relative;
            flex: 1 1 0;
            min-height: 0;
            overflow: hidden;
            align-items: stretch;
            justify-content: flex-end;
            padding:
              0
              max(16px, env(safe-area-inset-right, 0px))
              max(16px, env(safe-area-inset-bottom, 0px))
              max(16px, env(safe-area-inset-left, 0px));
          }

          .form-inner > .badge {
            display: none;
          }

          /* Signup: taller form — shrink hero & lift sheet so primary button stays on-screen */
          .form-side--signup .mobile-hero {
            max-height: 24vh;
            padding-top: max(8px, env(safe-area-inset-top, 0px));
            padding-bottom: 6px;
            gap: 8px;
          }

          .form-side--signup .mobile-hero-backdrop {
            width: min(180px, 58vw);
            height: min(180px, 58vw);
          }

          .form-side--signup .mobile-hero-logo-wrap .monocle-mark-svg {
            width: 68px !important;
            height: 68px !important;
          }

          .form-side--signup .mobile-hero-name {
            font-size: 21px;
          }

          .form-side--signup .mobile-hero-tag {
            font-size: 11px;
          }

          .form-side--signup .form-scroll {
            justify-content: flex-start;
            padding-top: 2px;
          }

          .form-side--signup .form-panel {
            padding: 16px 16px 18px;
          }

          .form-side--signup h1 {
            font-size: 19px;
            margin-bottom: 5px;
          }

          .form-side--signup .subtitle {
            margin-bottom: 8px;
            font-size: 12px;
            -webkit-line-clamp: 2;
          }

          .form-side--signup .form--signup {
            gap: 7px;
          }

          .form-side--signup .field {
            gap: 3px;
          }

          .form-side--signup .switch-text {
            margin-top: 6px;
          }

          /* Crossfade + slight lift — matches desktop, no 3D flip */
          .panel {
            width: 100%;
            max-width: 100%;
            transform: translate3d(0, 10px, 0) scale(0.99);
            opacity: 0;
            z-index: 0;
            box-sizing: border-box;
            transition: opacity 0.32s ease, transform 0.38s cubic-bezier(0.22, 1, 0.36, 1);
          }
          .panel.visible {
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 1;
            z-index: 2;
          }

          .form-panel {
            box-sizing: border-box;
            width: 100%;
            max-width: 100%;
            padding: 20px 18px 22px;
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            background: linear-gradient(165deg, rgba(28, 28, 31, 0.94) 0%, rgba(12, 12, 14, 0.97) 100%);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            box-shadow:
              inset 0 1px 0 rgba(255, 255, 255, 0.05),
              0 0 0 1px rgba(0, 0, 0, 0.45),
              0 20px 50px -24px rgba(0, 0, 0, 0.68),
              0 0 60px -28px rgba(74, 222, 128, 0.06);
            animation: none;
          }

          .form-side-bg::after {
            animation: login-grid-drift 22s linear infinite, mobile-ambient-shift 6s ease-in-out infinite;
          }

          .form-inner h1 {
            animation: mobile-fade-up 0.52s 0.08s cubic-bezier(0.22, 1, 0.36, 1) both;
          }
          .form-inner .subtitle {
            animation: mobile-fade-up 0.52s 0.18s cubic-bezier(0.22, 1, 0.36, 1) both;
          }
          .form-inner .form {
            animation: mobile-fade-up 0.52s 0.24s cubic-bezier(0.22, 1, 0.36, 1) both;
          }
          .form-inner .switch-text {
            animation: mobile-fade-up 0.5s 0.3s cubic-bezier(0.22, 1, 0.36, 1) both;
          }

          .subtitle {
            margin-bottom: 14px;
            font-size: 13px;
            line-height: 1.45;
            max-width: none;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
            overflow: hidden;
          }

          h1 {
            font-size: 21px;
            margin-bottom: 8px;
            line-height: 1.2;
            letter-spacing: -0.02em;
          }

          h1 .accent {
            font-style: normal;
          }

          .badge {
            margin-bottom: 10px;
            padding: 5px 12px;
            font-size: 11px;
          }

          .form {
            gap: 10px;
          }

          .form--signup {
            gap: 8px;
          }

          .field {
            gap: 4px;
          }

          .field label {
            font-size: 10px;
          }

          .input-box {
            height: 44px;
            min-height: 44px;
            border-radius: 11px;
            padding: 0 12px;
            transition:
              border-color 0.2s ease,
              box-shadow 0.2s ease,
              background 0.2s ease,
              transform 0.2s ease;
          }

          .input-box input {
            font-size: 16px;
          }

          .input-box:active {
            transform: scale(0.995);
          }

          .eye {
            min-width: 40px;
            min-height: 40px;
            padding: 8px;
            opacity: 0.65;
          }

          .btn-primary {
            height: 46px;
            min-height: 46px;
            margin-top: 2px;
            padding-top: 0;
            padding-bottom: 0;
            font-size: 15px;
            border-radius: 12px;
          }

          .switch-text {
            margin-top: 10px;
            font-size: 12px;
          }

          .switch-link {
            padding: 8px 4px;
            margin: -6px -4px;
            border-radius: 8px;
          }

          .forgot {
            padding: 6px 4px;
            margin: -6px -4px;
            border-radius: 8px;
            font-size: 12px;
          }

          .form-row {
            margin-top: 0;
            gap: 8px;
          }

          .cb-label {
            font-size: 12px;
            gap: 8px;
          }

          .row2 { grid-template-columns: 1fr; gap: 8px; }
        }

        @media (max-width: 900px) and (prefers-reduced-motion: reduce) {
          .form-panel {
            animation: none;
          }
          .form-side-bg::after {
            animation: none !important;
            opacity: 0.35;
          }
          .mobile-hero,
          .form-inner h1,
          .form-inner .subtitle,
          .form-inner .form,
          .form-inner .switch-text {
            animation: none !important;
          }
          .panel {
            transform: none !important;
            transition: opacity 0.2s ease !important;
          }
          .panel:not(.visible) {
            opacity: 0;
            pointer-events: none;
          }
          .panel.visible {
            opacity: 1;
            transform: none !important;
          }
        }

        @media (max-width: 900px) and (max-height: 720px) {
          .mobile-hero {
            max-height: 32vh;
            padding: max(6px, env(safe-area-inset-top, 0px)) 16px 8px;
            gap: 10px;
          }
          .mobile-hero-backdrop {
            width: min(200px, 65vw);
            height: min(200px, 65vw);
          }
          .mobile-hero-logo-wrap .monocle-mark-svg {
            width: 72px !important;
            height: 72px !important;
          }
          .mobile-hero-name {
            font-size: 22px;
          }
          .mobile-hero-tag {
            font-size: 11px;
          }
          .form-scroll {
            padding-bottom: max(10px, env(safe-area-inset-bottom, 0px));
          }
          .form-panel {
            padding: 10px 12px 12px;
          }
          h1 {
            font-size: 20px;
            margin-bottom: 4px;
          }
          .subtitle {
            margin-bottom: 8px;
            font-size: 11px;
            -webkit-line-clamp: 2;
          }
          .badge {
            margin-bottom: 6px;
            padding: 4px 10px;
            font-size: 10px;
          }
          .form,
          .form--signup {
            gap: 6px;
          }
          .field {
            gap: 2px;
          }
          .input-box {
            height: 42px;
            min-height: 42px;
          }
          .btn-primary {
            height: 44px;
            min-height: 44px;
            font-size: 14px;
          }
          .switch-text {
            margin-top: 6px;
          }

          .form-side--signup .mobile-hero {
            max-height: 20vh;
            gap: 6px;
          }
          .form-side--signup .mobile-hero-logo-wrap .monocle-mark-svg {
            width: 58px !important;
            height: 58px !important;
          }
          .form-side--signup .form--signup {
            gap: 5px;
          }
        }
      `}</style>
    </main>
  );
}
