import Link from "next/link";

export default function BriefingPage() {
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="briefing-screen screen">
      <div className="briefing-inner">
        <div className="briefing-date">{today} · Daily briefing</div>
        <h1 className="briefing-title">Your personal<br />sky report</h1>
        <p className="briefing-subtitle">AI-generated daily briefings are coming in Sprint 3.</p>

        <div className="briefing-content">
          <p>Your daily transit briefing will be generated here each morning — a 3–5 sentence reading grounded in your chart and today&apos;s sky, written personally for you.</p>
          <p>For now, ask Seraphova directly in the chat about today&apos;s transits and what they mean for your chart.</p>
        </div>

        <div className="briefing-cta">
          <Link href="/chat" className="btn btn-gold">Explore in chat</Link>
        </div>
      </div>
    </div>
  );
}
