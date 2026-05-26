"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "@/lib/mixpanel";

const TIMEZONES = [
  { value: "UTC-12", label: "UTC−12 — Baker Island, Howland Island" },
  { value: "UTC-11", label: "UTC−11 — American Samoa, Midway Island" },
  { value: "UTC-10", label: "UTC−10 — Hawaii (Honolulu)" },
  { value: "UTC-9", label: "UTC−9 — Alaska (Anchorage)" },
  { value: "UTC-8", label: "UTC−8 — US Pacific (Los Angeles, Vancouver)" },
  { value: "UTC-7", label: "UTC−7 — US Mountain (Denver, Phoenix)" },
  { value: "UTC-6", label: "UTC−6 — US Central (Chicago, Mexico City)" },
  { value: "UTC-5", label: "UTC−5 — US Eastern (New York, Toronto)" },
  { value: "UTC-4", label: "UTC−4 — Atlantic (Caracas, Santiago)" },
  { value: "UTC-3", label: "UTC−3 — Brazil (São Paulo), Argentina (Buenos Aires)" },
  { value: "UTC-2", label: "UTC−2 — South Georgia, Fernando de Noronha" },
  { value: "UTC-1", label: "UTC−1 — Azores (Portugal)" },
  { value: "UTC+0", label: "UTC+0 — UK (London), Ireland, West Africa (Ghana)" },
  { value: "UTC+1", label: "UTC+1 — Central Europe (Paris, Berlin, Rome, Madrid)" },
  { value: "UTC+2", label: "UTC+2 — Eastern Europe (Athens, Helsinki), Egypt (Cairo), South Africa" },
  { value: "UTC+3", label: "UTC+3 — Moscow, Turkey (Istanbul), East Africa (Nairobi, Riyadh)" },
  { value: "UTC+4", label: "UTC+4 — UAE (Dubai), Azerbaijan (Baku), Mauritius" },
  { value: "UTC+5", label: "UTC+5 — Pakistan (Karachi), Uzbekistan (Tashkent)" },
  { value: "UTC+5:30", label: "UTC+5:30 — India (Delhi, Mumbai), Sri Lanka" },
  { value: "UTC+6", label: "UTC+6 — Bangladesh (Dhaka), Kazakhstan (Almaty)" },
  { value: "UTC+7", label: "UTC+7 — Thailand (Bangkok), Vietnam, Indonesia (Jakarta)" },
  { value: "UTC+8", label: "UTC+8 — China (Beijing), Singapore, Philippines (Manila), Perth" },
  { value: "UTC+9", label: "UTC+9 — Japan (Tokyo), Korea (Seoul)" },
  { value: "UTC+10", label: "UTC+10 — Eastern Australia (Sydney, Melbourne)" },
  { value: "UTC+11", label: "UTC+11 — Solomon Islands, New Caledonia" },
  { value: "UTC+12", label: "UTC+12 — New Zealand (Auckland), Fiji" },
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
    track("onboarding_completed", {
      platform: "web",
      focus_area: FOCUS_OPTIONS[focus].label,
      has_situation: !!situation,
    });
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
                  <input className="input" type="time" value={birthTime} onChange={e => setBirthTime(e.target.value)} onClick={e => (e.currentTarget as HTMLInputElement).showPicker?.()} />
                </div>
                <div>
                  <label className="label">Timezone</label>
                  <select className="input" value={timezone} onChange={e => setTimezone(e.target.value)} style={{ cursor: "pointer" }}>
                    {TIMEZONES.map(tz => (
                      <option key={tz.value} value={tz.value}>{tz.label}</option>
                    ))}
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
            <p className="ob-sub">This helps Seraphova frame your first conversation with intention. You can always shift focus later.</p>

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
            <h2 className="ob-title"><em>Seraphova</em> is reading your chart</h2>
            <p className="ob-sub">
              {loading
                ? "Your natal chart is being computed…"
                : "Your natal chart has been computed. Here's your opening message."}
            </p>

            <div className="first-msg-wrap">
              <div className="first-msg-header">
                <div className="astral-avatar">✦</div>
                <div>
                  <div className="first-msg-name">Seraphova</div>
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
