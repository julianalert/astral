import Link from "next/link";
import StarField from "@/components/StarField";

const FEATURES = [
  { icon: "🔮", title: "Chart-aware AI", desc: "Every response is grounded in your unique natal placements — not generic sun sign content." },
  { icon: "🌊", title: "Live transit context", desc: "Today's sky mapped to your chart, every day. The AI knows what's active for you right now." },
  { icon: "🧠", title: "Remembers your life", desc: "Tell it what you're navigating. It carries that context forward — like a friend who actually listens." },
  { icon: "♾️", title: "Relationship lens", desc: "Add anyone. Get a deep compatibility read and an ongoing AI thread for navigating that dynamic." },
  { icon: "✍️", title: "Daily briefing", desc: "Wake up to a personalized transit note written for your chart, not the collective." },
  { icon: "🌑", title: "No woo, no fluff", desc: "Grounded, intelligent, occasionally witty. Astrology as a tool for self-knowledge." },
];

export default function LandingPage() {
  return (
    <>
      <StarField />
      <div className="app">
        <div className="landing screen">
          <div className="landing-hero">
            <div className="hero-glow" />
            <div className="hero-orbit stagger-1">
              <div className="hero-orbit-dot" />
              <div className="hero-center">✦</div>
            </div>
            <div className="hero-eyebrow stagger-2">Your chart knows you</div>
            <h1 className="hero-title stagger-3">
              The stars,<br /><em>translated</em><br />for you
            </h1>
            <p className="hero-sub stagger-4">
              An AI that knows your natal chart as deeply as you know yourself. Not horoscopes — genuine insight, in conversation.
            </p>
            <div className="hero-ctas stagger-5">
              <Link href="/signup" className="btn btn-gold">Begin your reading</Link>
              <Link href="/login" className="btn btn-outline">Sign in</Link>
            </div>
            <div className="hero-social-proof stagger-5">
              <div className="avatars-stack">
                {["🌙", "⭐", "✦", "🌟"].map((e, i) => (
                  <div key={i} className="av" style={{ background: `hsl(${240 + i * 20},40%,30%)` }}>{e}</div>
                ))}
              </div>
              <span>Trusted by 2,400+ seekers in early access</span>
            </div>
          </div>

          <div className="features-section">
            <div className="section-label">Why Astral</div>
            <h2 className="section-title">Your chart isn&apos;t a template.<br /><em>Neither are you.</em></h2>
            <div className="features-grid">
              {FEATURES.map((f, i) => (
                <div key={i} className="feature-card screen" style={{ animationDelay: `${i * 0.07}s` }}>
                  <div className="feature-icon">{f.icon}</div>
                  <div className="feature-title">{f.title}</div>
                  <div className="feature-desc">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
