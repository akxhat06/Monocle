"use client";

import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createBrowserSupabaseClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    if (!remember) {
      // Optional: in future we can alter persistence strategy.
    }

    window.location.href = "/";
  }

  return (
    <main className="auth-root">
      <section className="auth-left">
        <p className="mode">Log in</p>

        <h1>Welcome back!</h1>
        <p className="sub">Enter your credentials to access your account</p>

        <form className="form" onSubmit={onSubmit}>
          <label>Email address</label>
          <input
            className="field"
            type="email"
            required
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="row">
            <label>Password</label>
            <a href="#">forgot password</a>
          </div>
          <input
            className="field"
            type="password"
            required
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <label className="terms">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember for 30 days
          </label>

          {error ? <p className="error">{error}</p> : null}

          <button className="submit-btn" type="submit" disabled={loading}>
            {loading ? "LOGGING IN..." : "Login"}
          </button>

          <p className="foot">
            Don&apos;t have an account? <a href="#">Sign Up</a>
          </p>
        </form>
      </section>

      <section className="auth-right">
        <img className="side-art" src="/login-side.png" alt="Login side illustration" />
      </section>

      <style jsx>{`
        .auth-root {
          min-height: 100vh;
          display: grid;
          grid-template-columns: minmax(340px, 480px) 1fr;
          background: #f0f2f4;
          color: #101426;
          font-family: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .auth-left {
          background: #fff;
          padding: 28px 38px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          border-right: 1px solid #e4e8ef;
        }

        .mode {
          margin: 0 0 20px;
          font-size: 44px;
          line-height: 1;
          color: #a9aaad;
          font-weight: 500;
        }

        h1 {
          margin: 0;
          font-size: 44px;
          line-height: 1.08;
          letter-spacing: -0.02em;
        }

        .sub {
          margin: 10px 0 28px;
          color: #5f647a;
          font-size: 15px;
        }

        .form {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-width: 360px;
        }

        label {
          font-size: 14px;
          color: #2f3653;
          font-weight: 600;
          margin-top: 8px;
        }

        .row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 8px;
        }

        .row a {
          font-size: 12px;
          color: #596895;
          text-decoration: none;
        }

        .field {
          height: 44px;
          border: 1px solid #d8deea;
          border-radius: 9px;
          padding: 0 14px;
          font-size: 14px;
          color: #1f2340;
          background: #fff;
          outline: none;
        }

        .field:focus {
          border-color: #3a6f1f;
          box-shadow: 0 0 0 3px #3a6f1f1f;
        }

        .terms {
          margin-top: 8px;
          font-size: 12px;
          color: #585f7e;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
        }

        .submit-btn {
          height: 44px;
          border: 0;
          border-radius: 10px;
          font-weight: 700;
          color: #fff;
          background: #3a6f1f;
          margin-top: 6px;
          cursor: pointer;
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: default;
        }

        .foot {
          text-align: center;
          font-size: 14px;
          color: #3d4360;
          margin: 14px 0 0;
        }

        .foot a {
          color: #375fd5;
          text-decoration: none;
          font-weight: 600;
        }

        .error {
          color: #c53b4d;
          font-size: 12px;
          margin: 4px 0;
        }

        .auth-right {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          overflow: hidden;
        }

        .side-art {
          width: min(980px, 100%);
          height: min(86vh, 680px);
          object-fit: contain;
          object-position: center;
          border-radius: 14px;
          display: block;
        }

        @media (max-width: 1100px) {
          .auth-root {
            grid-template-columns: 1fr;
          }

          .auth-right {
            display: none;
          }

          .auth-left {
            align-items: center;
          }

          .mode,
          h1,
          .sub {
            text-align: center;
          }
        }
      `}</style>
    </main>
  );
}
