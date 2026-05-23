"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function BriefingPage() {
  const [briefing, setBriefing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    fetch("/api/briefing/today")
      .then(res => res.json())
      .then(data => {
        if (data.briefing) setBriefing(data.briefing);
        else setError(data.error ?? "Could not generate briefing.");
      })
      .catch(() => setError("Something went wrong."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="briefing-screen screen">
      <div className="briefing-inner">
        <div className="briefing-date">{today} · Daily briefing</div>
        <h1 className="briefing-title">Your personal<br />sky report</h1>

        {loading && (
          <div className="briefing-content">
            <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "var(--muted)" }}>
              <div className="typing-dots"><span /><span /><span /></div>
              <span style={{ fontSize: "14px" }}>Generating your reading…</span>
            </div>
          </div>
        )}

        {error && (
          <div className="briefing-content">
            <p style={{ color: "var(--muted)" }}>{error}</p>
          </div>
        )}

        {briefing && (
          <>
            <div className="briefing-content">
              <p style={{ lineHeight: "1.8", fontSize: "16px" }}>{briefing}</p>
            </div>

            <div className="briefing-cta" style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <Link href="/chat" className="btn btn-gold">Explore in chat →</Link>
              <Link href="/chat" className="btn btn-outline">Ask a follow-up</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
