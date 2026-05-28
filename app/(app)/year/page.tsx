"use client";
import { useState, useEffect } from "react";
interface ProfectionData {
  profection: {
    house: number;
    houseName: string;
    themes: string;
    lordOfYear: string;
    lordSign: string;
    age: number;
    daysRemaining: number;
    isBirthday: boolean;
    yearStart: string;
    yearEnd: string;
  };
  progress: number;
  next: {
    house: number;
    houseName: string;
    themes: string;
    lordOfYear: string;
  };
}

function formatYearRange(startIso: string, endIso: string) {
  const fmt = (s: string) =>
    new Date(s).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  return `${fmt(startIso)} → ${fmt(endIso)}`;
}

export default function YearPage() {
  const [profectionData, setProfectionData] = useState<ProfectionData | null>(null);
  const [profectionLoading, setProfectionLoading] = useState(true);

  const [reading, setReading] = useState<string | null>(null);
  const [readingLoading, setReadingLoading] = useState(false);
  const [readingError, setReadingError] = useState<string | null>(null);
  const [generated, setGenerated] = useState(false);

  // Load profection data
  useEffect(() => {
    fetch("/api/profection/current")
      .then(r => r.json())
      .then(d => { if (d.profection) setProfectionData(d); })
      .catch(() => {})
      .finally(() => setProfectionLoading(false));
  }, []);

  // Check for a cached reading
  useEffect(() => {
    fetch("/api/profection/reading")
      .then(r => r.json())
      .then(d => { if (d.reading) { setReading(d.reading); setGenerated(true); } })
      .catch(() => {});
  }, []);

  const handleGenerate = async () => {
    setReadingLoading(true);
    setReadingError(null);
    try {
      const res = await fetch("/api/profection/reading", { method: "POST" });
      const data = await res.json();
      if (data.reading) {
        setReading(data.reading);
        setGenerated(true);
      } else {
        setReadingError("Something went wrong generating your reading. Please try again.");
      }
    } catch {
      setReadingError("Something went wrong. Please try again.");
    } finally {
      setReadingLoading(false);
    }
  };

  const handleExploreInChat = () => {
    window.location.href = "/chat?new=true&source=year";
  };

  const p = profectionData?.profection;
  const pct = profectionData ? Math.round(profectionData.progress * 100) : 0;
  const isTransitionSoon = p ? p.daysRemaining <= 30 : false;
  const isVeryClose = p ? p.daysRemaining <= 7 : false;
  const themeLabel = p ? p.themes.split("—")[0].trim() : "";

  return (
    <div className="briefing-screen screen">
      <div className="briefing-inner">

        {/* Page title */}
        <div className="briefing-date" style={{ marginBottom: "6px" }}>Annual theme</div>
        <h1 className="briefing-title" style={{ marginBottom: "28px" }}>Your year</h1>

        {/* ── HERO CARD ── */}
        {profectionLoading && (
          <div className="card" style={{ marginBottom: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--muted)" }}>
              <div className="typing-dots"><span /><span /><span /></div>
              <span style={{ fontSize: "14px" }}>Loading your annual theme…</span>
            </div>
          </div>
        )}

        {p && (
          <div className="year-hero-card card" style={{ marginBottom: "28px" }}>
            <div style={{ marginBottom: "16px" }}>
              <span className="your-year-eyebrow">Age {p.age} · {formatYearRange(p.yearStart, p.yearEnd)}</span>
            </div>

            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(34px, 6vw, 48px)",
              fontWeight: 300,
              lineHeight: 1.15,
              marginBottom: "10px",
              color: "var(--text)",
            }}>
              {p.houseName.charAt(0).toUpperCase() + p.houseName.slice(1)} Year
            </div>

            <div style={{ fontSize: "15px", color: "var(--muted)", marginBottom: "20px", lineHeight: "1.6" }}>
              {themeLabel}
            </div>

            <div style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "8px 14px",
              background: "var(--gold-glow)",
              border: "1px solid rgba(201,168,76,0.2)",
              borderRadius: "var(--r)",
              marginBottom: "24px",
            }}>
              <span style={{ fontSize: "12px", color: "var(--gold)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Lord of the Year</span>
              <span style={{ fontSize: "14px", color: "var(--text)", fontWeight: 500 }}>{p.lordOfYear}</span>
              <span style={{ fontSize: "12px", color: "var(--muted)" }}>ruling {p.lordSign}</span>
            </div>

            {/* Progress bar */}
            <div className="your-year-progress-wrap" style={{ marginBottom: isVeryClose ? "10px" : "20px" }}>
              <div className="your-year-progress-track">
                <div
                  className={`your-year-progress-fill${isVeryClose ? " near-end" : ""}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className={`your-year-days${isTransitionSoon ? " soon" : ""}`}>
                {p.daysRemaining === 1 ? "1 day left" : `${p.daysRemaining} days left`}
              </span>
            </div>

            {isVeryClose && profectionData?.next && (
              <div className="your-year-upcoming" style={{ marginBottom: "20px" }}>
                Next: {profectionData.next.houseName} year — {profectionData.next.themes.split("—")[0].trim().toLowerCase()}
              </div>
            )}

            {/* Explore in chat CTA */}
            <button className="btn btn-outline btn-sm" onClick={handleExploreInChat}
              style={{ fontSize: "13px", padding: "9px 18px" }}>
              Explore this year in chat →
            </button>
          </div>
        )}

        {/* ── DIVIDER ── */}
        {p && (
          <div style={{
            display: "flex", alignItems: "center", gap: "16px",
            marginBottom: "28px",
          }}>
            <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
            <span style={{ fontSize: "11px", color: "var(--muted2)", letterSpacing: "0.14em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
              Annual reading
            </span>
            <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
          </div>
        )}

        {/* ── READING SECTION ── */}
        {!generated && !readingLoading && p && (
          <div className="year-generate-cta card" style={{ textAlign: "center", padding: "36px 28px" }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", fontWeight: 300, marginBottom: "12px", color: "var(--text)" }}>
              Get your full {p.houseName} year reading
            </div>
            <p style={{ fontSize: "14px", color: "var(--muted)", lineHeight: "1.7", marginBottom: "28px", maxWidth: "420px", margin: "0 auto 28px" }}>
              A personalised narrative: what this year means for you specifically, how your Lord of the Year shapes it, and what to pay attention to.
            </p>
            <button className="btn btn-gold" onClick={handleGenerate}>
              Generate my annual reading
            </button>
            {readingError && (
              <p style={{ marginTop: "16px", fontSize: "13px", color: "var(--muted)" }}>{readingError}</p>
            )}
          </div>
        )}

        {readingLoading && (
          <div className="briefing-content">
            <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "var(--muted)" }}>
              <div className="typing-dots"><span /><span /><span /></div>
              <span style={{ fontSize: "14px" }}>Generating your annual reading…</span>
            </div>
          </div>
        )}

        {reading && generated && (
          <>
            <div className="briefing-content">
              {reading.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>

            <p style={{ fontSize: "12px", color: "var(--muted2)", textAlign: "center", marginBottom: "16px" }}>
              This reading is saved and will refresh automatically when your next annual cycle begins.
            </p>

            <div className="briefing-cta" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
              <button
                className="btn btn-outline"
                style={{ fontSize: "13px", padding: "9px 18px" }}
                onClick={handleGenerate}
                disabled={readingLoading}
              >
                Regenerate
              </button>
              <button className="btn btn-gold" onClick={handleExploreInChat}>
                Explore in chat →
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
