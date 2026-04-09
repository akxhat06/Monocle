"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MonocleMarkAnimated from "@/components/brand/MonocleMarkAnimated";
import { PRODUCT_NAME, PRODUCT_TAGLINE } from "@/lib/brand";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");

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

  function flipTo(target: "login" | "signup") {
    setError(null);
    setMode(target);
  }

  const channels = [
    { label: "Radio", value: "13,514", active: false },
    { label: "TV", value: "21,845", active: true },
    { label: "Web", value: "1,951", active: false },
    { label: "PA", value: "841", active: false },
  ];
  const customerBars = [40, 55, 48, 65, 72, 80, 58, 45];
  const matrixData = [
    [3, 2, 1], [2, 3, 2], [3, 1, 3], [2, 2, 1], [3, 3, 2], [1, 2, 3], [2, 3, 1], [3, 1, 2],
  ];

  const isLogin = mode === "login";

  return (
    <main className="login-shell">
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

          <div className="channel-tabs">
            {channels.map((ch) => (
              <div key={ch.label} className={`channel-tab${ch.active ? " active" : ""}`}>
                {ch.label} {ch.value}
              </div>
            ))}
          </div>

          <div className="cards-row">
            <div className="dash-card">
              <div className="card-label">PRODUCT</div>
              <div className="area-chart">
                <svg viewBox="0 0 200 80" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="af" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4ade80" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#4ade80" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>
                  <path d="M0 60 Q20 55 40 48 T80 35 T120 28 T160 22 T200 18 V80 H0Z" fill="url(#af)" />
                  <path d="M0 60 Q20 55 40 48 T80 35 T120 28 T160 22 T200 18" fill="none" stroke="#4ade80" strokeWidth="2" />
                  <path d="M0 65 Q30 60 60 58 T120 50 T180 44 T200 40" fill="none" stroke="#4ade80" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.4" />
                </svg>
              </div>
              <div className="card-stats">
                <div className="stat"><span className="stat-l">E-Cars</span><span className="stat-v">59% <span className="up">&#8593;</span></span></div>
                <div className="stat"><span className="stat-l">Moto</span><span className="stat-v">41% <span className="up">&#8593;</span></span></div>
              </div>
            </div>

            <div className="dash-card">
              <div className="card-label">CUSTOMER</div>
              <div className="bar-chart">
                {customerBars.map((h, i) => (
                  <div key={i} className="bar-col"><div className="bar" style={{ height: `${h}%` }} /></div>
                ))}
              </div>
              <div className="card-stats">
                <div className="stat"><span className="stat-l">BMW</span><span className="stat-v">32% <span className="up">&#8593;</span></span></div>
                <div className="stat"><span className="stat-l">E-Cars</span><span className="stat-v">68% <span className="up">&#8593;</span></span></div>
              </div>
            </div>
          </div>

          <div className="dash-card matrix-card">
            <div className="card-label">PRODUCT MATRIX</div>
            <div className="matrix-grid">
              {matrixData.map((col, ci) => (
                <div key={ci} className="matrix-col">
                  {col.map((v, ri) => <div key={ri} className={`mdot s${v}`} />)}
                </div>
              ))}
            </div>
            <div className="card-stats">
              <div className="stat"><span className="stat-l">4x4</span><span className="stat-v">65% <span className="up">&#8593;</span></span></div>
              <div className="stat"><span className="stat-l">Passenger</span><span className="stat-v">35% <span className="up">&#8593;</span></span></div>
            </div>
          </div>

          <div className="legend">
            <span className="ldot green" /> CL
            <span className="ldot lime" /> FA Cup
            <span className="ldot yellow" /> BPCL
          </div>
        </div>
      </section>

      {/* ===== RIGHT: Animated Forms ===== */}
      <section className="form-side">
        <div className="form-scroll">

          {/* ---- Sign In ---- */}
          <div className={`panel${isLogin ? " visible" : ""}`}>
            <div className="form-inner">
              <div className="badge"><span className="badge-dot" />{PRODUCT_TAGLINE}</div>
              <h1>Sign in to<br /><span className="accent">{PRODUCT_NAME}</span></h1>
              <p className="subtitle">
                {PRODUCT_TAGLINE} — ask in natural language; analytics dashboards reshape to every query.
              </p>

              <form onSubmit={onLogin} className="form">
                <div className="field">
                  <label>EMAIL ADDRESS</label>
                  <div className="input-box">
                    <svg className="ic" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="3" /><path d="M2 7l10 7 10-7" /></svg>
                    <input type="email" required placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                </div>

                <div className="field">
                  <label>PASSWORD</label>
                  <div className="input-box">
                    <svg className="ic" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 118 0v4" /></svg>
                    <input type={showPassword ? "text" : "password"} required placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <button type="button" className="eye" onClick={() => setShowPassword(!showPassword)}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round">
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
                <button type="button" className="switch-link" onClick={() => flipTo("signup")}>Create one free →</button>
              </p>
            </div>
          </div>

          {/* ---- Sign Up ---- */}
          <div className={`panel${!isLogin ? " visible" : ""}`}>
            <div className="form-inner">
              <div className="badge"><span className="badge-dot" />{PRODUCT_NAME}</div>
              <h1>Create your<br /><span className="accent">Account</span></h1>
              <p className="subtitle">
                {PRODUCT_TAGLINE}. Join and start asking your data anything.
              </p>

              <form onSubmit={onSignup} className="form">
                <div className="field">
                  <label>FULL NAME</label>
                  <div className="input-box">
                    <svg className="ic" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    <input type="text" required placeholder="Enter your full name" value={signupName} onChange={(e) => setSignupName(e.target.value)} />
                  </div>
                </div>

                <div className="field">
                  <label>EMAIL ADDRESS</label>
                  <div className="input-box">
                    <svg className="ic" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="3" /><path d="M2 7l10 7 10-7" /></svg>
                    <input type="email" required placeholder="Enter your email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} />
                  </div>
                </div>

                <div className="row2">
                  <div className="field">
                    <label>PASSWORD</label>
                    <div className="input-box">
                      <svg className="ic" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 118 0v4" /></svg>
                      <input type={showSignupPw ? "text" : "password"} required placeholder="Create password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} />
                      <button type="button" className="eye" onClick={() => setShowSignupPw(!showSignupPw)}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round">
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
                      <svg className="ic" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 118 0v4" /></svg>
                      <input type={showSignupConfirm ? "text" : "password"} required placeholder="Confirm password" value={signupConfirm} onChange={(e) => setSignupConfirm(e.target.value)} />
                      <button type="button" className="eye" onClick={() => setShowSignupConfirm(!showSignupConfirm)}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round">
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
                <button type="button" className="switch-link" onClick={() => flipTo("login")}>Sign in →</button>
              </p>
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
        .loader-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: #0c1018;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
        }

        .loader-spinner {
          width: 44px;
          height: 44px;
          border: 3px solid #1e2a38;
          border-top-color: #4ade80;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        .loader-text {
          color: #6b7f96;
          font-size: 14px;
          font-weight: 500;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .login-shell {
          position: fixed;
          inset: 0;
          display: grid;
          grid-template-columns: 1fr 1fr;
          font-family: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          overflow: hidden;
          color-scheme: dark;
        }

        /* ===== LEFT ===== */
        .dash-side { background: #0c1018; padding: 28px 32px; overflow: hidden; display: flex; flex-direction: column; }
        .dash-inner { display: flex; flex-direction: column; height: 100%; gap: 16px; }
        .dash-brand { display: flex; align-items: center; gap: 12px; }
        .dash-brand-text { display: flex; flex-direction: column; gap: 2px; }
        .dash-brand-name { font-size: 22px; font-weight: 700; color: #fff; font-style: italic; line-height: 1.15; }
        .dash-brand-tagline { font-size: 11px; font-weight: 500; color: rgba(255, 255, 255, 0.42); letter-spacing: 0.03em; }
        .channel-tabs { display: flex; gap: 8px; flex-wrap: wrap; }
        .channel-tab { padding: 6px 14px; border-radius: 20px; font-size: 12px; color: #8a9bb0; border: 1px solid #1e2a38; white-space: nowrap; }
        .channel-tab.active { background: #4ade80; color: #0c1018; border-color: #4ade80; font-weight: 600; }
        .cards-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .dash-card { background: #131b28; border: 1px solid #1e2a38; border-radius: 14px; padding: 14px 16px; display: flex; flex-direction: column; gap: 8px; }
        .card-label { font-size: 11px; font-weight: 600; color: #6b7f96; letter-spacing: 0.06em; text-transform: uppercase; }
        .area-chart svg { width: 100%; height: 60px; }
        .bar-chart { display: flex; align-items: flex-end; gap: 6px; height: 60px; }
        .bar-col { flex: 1; height: 100%; display: flex; align-items: flex-end; }
        .bar { width: 100%; background: linear-gradient(to top, #22c55e, #86efac); border-radius: 3px 3px 0 0; min-height: 4px; }
        .card-stats { display: flex; gap: 20px; }
        .stat { display: flex; flex-direction: column; gap: 2px; }
        .stat-l { font-size: 11px; color: #6b7f96; }
        .stat-v { font-size: 14px; font-weight: 700; color: #e2e8f0; }
        .up { color: #4ade80; font-size: 12px; }
        .matrix-card { flex: 1; min-height: 0; }
        .matrix-grid { display: flex; gap: 12px; justify-content: space-between; flex: 1; align-items: center; padding: 8px 0; }
        .matrix-col { display: flex; flex-direction: column; gap: 6px; align-items: center; }
        .mdot { border-radius: 50%; }
        .mdot.s1 { width: 10px; height: 10px; background: #eab308; }
        .mdot.s2 { width: 14px; height: 14px; background: #86efac; }
        .mdot.s3 { width: 18px; height: 18px; background: #22c55e; }
        .legend { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #6b7f96; margin-top: auto; }
        .ldot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-left: 10px; }
        .ldot:first-child { margin-left: 0; }
        .ldot.green { background: #22c55e; }
        .ldot.lime { background: #86efac; }
        .ldot.yellow { background: #eab308; }

        /* ===== RIGHT: Form panels ===== */
        .form-side {
          background: #111827;
          overflow: hidden;
        }

        .form-scroll {
          width: 100%;
          height: 100%;
          overflow-y: auto;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 40px;
          box-sizing: border-box;
          position: relative;
        }

        .panel {
          position: absolute;
          width: calc(100% - 80px);
          max-width: 480px;
          opacity: 0;
          transform: rotateY(90deg) scale(0.95);
          transition: opacity 0.35s ease, transform 0.45s cubic-bezier(0.4, 0.0, 0.2, 1);
          pointer-events: none;
        }

        .panel.visible {
          opacity: 1;
          transform: rotateY(0deg) scale(1);
          pointer-events: auto;
          position: relative;
          width: 100%;
        }

        /* ===== SHARED FORM STYLES ===== */
        .form-inner { width: 100%; }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          border-radius: 20px;
          border: 1px solid #22c55e;
          font-size: 13px;
          font-weight: 500;
          color: #4ade80;
          margin-bottom: 20px;
        }

        .badge-dot { width: 8px; height: 8px; border-radius: 50%; background: #4ade80; }

        h1 {
          margin: 0 0 6px;
          font-size: clamp(26px, 3.2vw, 38px);
          font-weight: 800;
          color: #f1f5f9;
          line-height: 1.15;
          letter-spacing: -0.01em;
        }

        .accent { color: #4ade80; font-style: italic; }

        .subtitle {
          margin: 0 0 24px;
          font-size: 14px;
          color: #6b7f96;
          line-height: 1.5;
          font-family: "IBM Plex Mono", "SF Mono", monospace;
        }

        .form { display: flex; flex-direction: column; gap: 14px; }

        .field { display: flex; flex-direction: column; gap: 5px; }

        .field label {
          font-size: 11px;
          font-weight: 600;
          color: #8a9bb0;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        .input-box {
          display: flex;
          align-items: center;
          height: 50px;
          border-radius: 12px;
          border: 1.5px solid #1e2a38;
          background: #131b28;
          padding: 0 14px;
          gap: 10px;
          transition: border-color 0.15s;
          width: 100%;
          box-sizing: border-box;
        }

        .input-box:focus-within {
          border-color: #4ade80;
          box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.1);
        }

        .ic { flex-shrink: 0; opacity: 0.5; }

        .input-box input {
          flex: 1;
          min-width: 0;
          height: 100%;
          border: none;
          background: transparent;
          color: #e2e8f0;
          font-size: 14px;
          outline: none;
        }

        .input-box input::placeholder { color: #4a5568; }

        .input-box input:-webkit-autofill,
        .input-box input:-webkit-autofill:focus {
          -webkit-text-fill-color: #e2e8f0;
          -webkit-box-shadow: 0 0 0 1000px #131b28 inset;
          transition: background-color 5000s ease-in-out 0s;
        }

        .eye {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          display: grid;
          place-items: center;
          opacity: 0.5;
          transition: opacity 0.15s;
          flex-shrink: 0;
        }

        .eye:hover { opacity: 1; }

        .form-row { display: flex; align-items: center; justify-content: space-between; }

        .cb-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #8a9bb0;
          cursor: pointer;
          user-select: none;
        }

        .cb {
          width: 20px;
          height: 20px;
          border-radius: 5px;
          border: 1.5px solid #1e2a38;
          background: #131b28;
          display: grid;
          place-items: center;
          transition: all 0.15s;
          flex-shrink: 0;
        }

        .cb.on { background: #22c55e; border-color: #22c55e; }

        .forgot { font-size: 13px; color: #4ade80; text-decoration: none; font-weight: 500; }
        .forgot:hover { text-decoration: underline; }

        .tlink { color: #4ade80; font-weight: 500; }

        .err { margin: 0; color: #f87171; font-size: 13px; }

        .btn-primary {
          height: 50px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, #22c55e, #4ade80);
          color: #0c1018;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.2s;
          margin-top: 2px;
        }

        .btn-primary:hover { opacity: 0.9; }
        .btn-primary:disabled { opacity: 0.6; cursor: default; }

        .switch-text {
          margin-top: 22px;
          text-align: center;
          font-size: 13px;
          color: #6b7f96;
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

        .switch-link:hover { text-decoration: underline; }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 900px) {
          .login-shell { grid-template-columns: 1fr; }
          .dash-side { display: none; }
          .form-scroll { padding: 24px 20px; }
          .panel { width: calc(100% - 40px); }
          .row2 { grid-template-columns: 1fr; }
        }

        @media (max-height: 750px) {
          .form-scroll { padding: 14px 24px; }
          h1 { font-size: 24px; margin-bottom: 4px; }
          .subtitle { margin-bottom: 12px; font-size: 12px; }
          .badge { margin-bottom: 10px; padding: 4px 12px; font-size: 11px; }
          .form { gap: 10px; }
          .input-box { height: 44px; }
          .btn-primary { height: 44px; margin-top: 0; }
          .switch-text { margin-top: 10px; }
        }
      `}</style>
    </main>
  );
}
