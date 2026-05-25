"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { track } from "@/lib/mixpanel";

function toLocalDateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return toLocalDateString(d);
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

export default function BriefingPage() {
  const todayStr = toLocalDateString(new Date());

  const [currentDate, setCurrentDate] = useState(todayStr);
  const [briefing, setBriefing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onboardingToday, setOnboardingToday] = useState(false);

  const isToday = currentDate === todayStr;

  const loadBriefing = useCallback((date: string) => {
    setLoading(true);
    setBriefing(null);
    setError(null);
    setOnboardingToday(false);
    fetch(`/api/briefing/today?date=${date}`)
      .then(res => res.json())
      .then(data => {
        if (data.briefing) {
          setBriefing(data.briefing);
          track("briefing_viewed", {
            platform: "web",
            is_today: date === toLocalDateString(new Date()),
            briefing_date: date,
          });
        } else if (data.onboarding_today) {
          setOnboardingToday(true);
        } else if (data.error) {
          setError(data.error);
        } else {
          setError("No briefing available for this date.");
        }
      })
      .catch(() => setError("Something went wrong."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadBriefing(currentDate);
  }, [currentDate, loadBriefing]);

  const goToPrev = () => setCurrentDate(d => addDays(d, -1));
  const goToNext = () => setCurrentDate(d => addDays(d, 1));

  return (
    <div className="briefing-screen screen">
      <div className="briefing-inner">

        {/* Date nav */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
          <button
            onClick={goToPrev}
            style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "18px", padding: "4px 8px", lineHeight: 1 }}
            aria-label="Previous day"
          >
            ←
          </button>
          <div className="briefing-date" style={{ margin: 0, flex: 1, textAlign: "center" }}>
            {formatDate(currentDate)} · {isToday ? "Today's briefing" : "Daily briefing"}
          </div>
          <button
            onClick={goToNext}
            disabled={isToday}
            style={{ background: "none", border: "none", color: isToday ? "transparent" : "var(--muted)", cursor: isToday ? "default" : "pointer", fontSize: "18px", padding: "4px 8px", lineHeight: 1 }}
            aria-label="Next day"
          >
            →
          </button>
        </div>

        <h1 className="briefing-title" style={{ textAlign: "center" }}>Your personal sky report</h1>

        {loading && (
          <div className="briefing-content">
            <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "var(--muted)" }}>
              <div className="typing-dots"><span /><span /><span /></div>
              <span style={{ fontSize: "14px" }}>
                {isToday ? "Generating your reading…" : "Loading…"}
              </span>
            </div>
          </div>
        )}

        {onboardingToday && (
          <div className="briefing-content" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "32px", marginBottom: "16px", opacity: 0.5 }}>🌙</div>
            <p style={{ fontSize: "15px", lineHeight: "1.8", color: "var(--text)" }}>
              Your first sky report will be ready tomorrow morning.
            </p>
            <p style={{ fontSize: "13px", color: "var(--muted)", marginTop: "8px" }}>
              You&apos;ll receive it by email at 6 AM. Your reading in the chat already reflects today&apos;s sky — that&apos;s your starting point.
            </p>
            <Link href="/chat" className="btn btn-outline btn-sm" style={{ marginTop: "20px", display: "inline-flex" }}>
              Back to chat
            </Link>
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

            {isToday && (
              <div className="briefing-cta" style={{ display: "flex", justifyContent: "flex-end" }}>
                <Link href="/chat?new=true" className="btn btn-gold">Explore in chat →</Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
