"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const TIMEZONES = [
  "UTC-12", "UTC-11", "UTC-10", "UTC-9", "UTC-8", "UTC-7", "UTC-6",
  "UTC-5", "UTC-4", "UTC-3", "UTC-2", "UTC-1", "UTC+0",
  "UTC+1", "UTC+2", "UTC+3", "UTC+4", "UTC+5", "UTC+5:30",
  "UTC+6", "UTC+7", "UTC+8", "UTC+9", "UTC+10", "UTC+11", "UTC+12",
];

const FOCUS_OPTIONS = [
  { icon: "💼", label: "Career & purpose" },
  { icon: "💕", label: "Love & relationships" },
  { icon: "🌱", label: "Self & growth" },
  { icon: "🌀", label: "All of the above" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [firstMessage, setFirstMessage] = useState("");

  // Step 1: Birth data
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("12:00");
  const [birthLocation, setBirthLocation] = useState("");
  const [timezone, setTimezone] = useState("UTC+0");

  // Step 2: Context
  const [focus, setFocus] = useState<number | null>(null);
  const [situation, setSituation] = useState("");

  const handleBirthStep = async () => {
    if (!birthDate || !birthLocation) { setError("Please fill in date and location"); return; }
    setError("");
    setLoading(true);
    const res = await fetch("/api/onboarding/chart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ birthDate, birthTime, birthLocation, timezone }),
    });
    setLoading(false);
    if (!res.ok) {
      const text = await res.text();
      let msg = "Could not compute chart. Check the birth location.";
      try { msg = JSON.parse(text).error ?? msg; } catch {}
      setError(msg);
      return;
    }
    setStep(1);
  };

  const handleContextStep = async () => {
    if (focus === null) { setError("Pick a focus area"); return; }
    setError("");
    // Go to step 3 immediately so the typing animation shows while we wait
    setStep(2);
    setLoading(true);
    const res = await fetch("/api/onboarding/context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        focus: FOCUS_OPTIONS[focus].label,
        situation: situation || undefined,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const text = await res.text();
      let msg = "Something went wrong generating your first reading.";
      try { msg = JSON.parse(text).error ?? msg; } catch {}
      // Go back to step 1 so they can try again
      setStep(1);
      setError(msg);
      return;
    }
    const data = await res.json();
    setFirstMessage(data.message);
  };

  return (
    <div className="onboarding screen">
      <div className="onboarding-inner">
        <div className="ob-progress">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`ob-step ${i < step ? "done" : i === step ? "active" : ""}`} />
          ))}
        </div>

        {step === 0 && (
          <div className="screen">
            <div className="ob-eyebrow">Step 1 of 3</div>
            <h2 className="ob-title">When were you <em>born?</em></h2>
            <p className="ob-sub">Your natal chart is calculated from the exact moment and place of your birth. The more precise, the more personal.</p>

            {error && <div className="error-msg" style={{ marginBottom: "16px" }}>{error}</div>}

            <div className="ob-fields">
              <div>
                <label className="label">Date of birth</label>
                <input className="input" type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
              </div>
              <div className="ob-row">
                <div>
                  <label className="label">Time of birth</label>
                  <input className="input" type="time" value={birthTime} onChange={e => setBirthTime(e.target.value)} />
                </div>
                <div>
                  <label className="label">Timezone</label>
                  <select className="input" value={timezone} onChange={e => setTimezone(e.target.value)} style={{ cursor: "pointer" }}>
                    {TIMEZONES.map(tz => <option key={tz}>{tz}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Place of birth</label>
                <input className="input" type="text" placeholder="e.g. Paris, France" value={birthLocation} onChange={e => setBirthLocation(e.target.value)} />
              </div>
            </div>

            <p style={{ fontSize: "12px", color: "var(--muted2)", marginBottom: "24px" }}>
              Don&apos;t know your exact birth time? Use noon — the chart will still be meaningful.
            </p>
            <button className="btn btn-gold" onClick={handleBirthStep} disabled={loading}>
              {loading ? "Computing your chart…" : "Calculate my chart →"}
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="screen">
            <div className="ob-eyebrow">Step 2 of 3</div>
            <h2 className="ob-title">What are you <em>navigating?</em></h2>
            <p className="ob-sub">This helps Astral frame your first conversation with intention. You can always shift focus later.</p>

            {error && <div className="error-msg" style={{ marginBottom: "16px" }}>{error}</div>}

            <div className="choice-grid">
              {FOCUS_OPTIONS.map((c, i) => (
                <div key={i} className={`choice-card ${focus === i ? "selected" : ""}`} onClick={() => setFocus(i)}>
                  <div className="choice-icon">{c.icon}</div>
                  <div className="choice-label">{c.label}</div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label className="label">In one line — what&apos;s going on? (optional)</label>
              <input className="input" placeholder="e.g. figuring out whether to change careers…" value={situation} onChange={e => setSituation(e.target.value)} />
            </div>
            <button className="btn btn-gold" onClick={handleContextStep} disabled={loading}>
              {loading ? "Generating your reading…" : "Prepare my reading →"}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="screen">
            <div className="ob-eyebrow">Step 3 of 3</div>
            <h2 className="ob-title"><em>Astral</em> is reading your chart</h2>
            <p className="ob-sub">Your natal chart has been computed. Here&apos;s your opening message.</p>

            <div className="first-msg-wrap">
              <div className="first-msg-header">
                <div className="astral-avatar">✦</div>
                <div>
                  <div className="first-msg-name">Astral</div>
                  <div className="first-msg-time">Just now</div>
                </div>
              </div>
              {loading ? (
                <div className="typing-dots"><span /><span /><span /></div>
              ) : (
                <div className="first-msg-text">{firstMessage}</div>
              )}
            </div>

            {!loading && (
              <button className="btn btn-gold" onClick={() => router.push("/chat")}>
                Open my reading →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
