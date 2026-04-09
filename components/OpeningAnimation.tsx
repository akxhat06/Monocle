"use client";

import { useEffect, useState } from "react";

export default function OpeningAnimation() {
  const [phase, setPhase] = useState<"scene1" | "exit" | "done">("scene1");

  useEffect(() => {
    const ex = window.setTimeout(() => setPhase("exit"), 2600);
    const dn = window.setTimeout(() => setPhase("done"), 3200);
    return () => {
      window.clearTimeout(ex);
      window.clearTimeout(dn);
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div className={`oa-overlay ${phase === "exit" ? "oa-fade" : ""}`}>
      <div className="oa-scene oa-show">
        <div className="oa-window oa-from-left">
          <div className="oa-window-head"><span /><span /><span /></div>
          <div className="oa-window-body">
            <div className="oa-search oa-from-right" />
            <div className="oa-grid">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className={`oa-cell ${i % 2 === 0 ? "oa-from-left" : "oa-from-right"} ${(i + 1) % 3 === 0 || i % 4 === 1 ? "oa-dark" : ""} ${(i === 4 || i === 8) ? "oa-dashed" : ""}`}
                  style={{ animationDelay: `${460 + i * 55}ms` }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="oa-snode oa-dot oa-tl oa-from-left" style={{ animationDelay: "180ms" }} />
        <div className="oa-snode oa-pill oa-tr oa-from-right" style={{ animationDelay: "260ms" }} />
        <div className="oa-snode oa-pill oa-ml oa-from-left" style={{ animationDelay: "340ms" }} />
        <div className="oa-snode oa-pill oa-mr oa-from-right" style={{ animationDelay: "420ms" }} />
        <div className="oa-snode oa-dashed-box oa-dl oa-from-left" style={{ animationDelay: "500ms" }} />
        <div className="oa-snode oa-dashed-box oa-trb oa-from-right" style={{ animationDelay: "580ms" }} />
        <div className="oa-snode oa-square oa-br oa-from-right" style={{ animationDelay: "660ms" }} />

        <svg className="oa-links" viewBox="0 0 1000 560" aria-hidden>
          <path d="M200 150 L200 120 L770 120 L770 186" style={{ animationDelay: "760ms" }} />
          <path d="M770 248 L770 330" style={{ animationDelay: "860ms" }} />
          <path d="M120 330 L200 330 L200 404 L770 404 L770 370" style={{ animationDelay: "940ms" }} />
        </svg>
      </div>
    </div>
  );
}
