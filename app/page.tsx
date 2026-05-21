import Link from "next/link";
import LandingFaq from "@/components/LandingFaq";
import LandingNav from "@/components/LandingNav";
import StarField from "@/components/StarField";

export default function LandingPage() {
  return (
    <>
      <StarField />
      <LandingNav />

      <section className="landing-hero">
        <div className="hero-orbit stagger-1">
          <div className="hero-orbit-dot" />
          <div className="hero-center">✦</div>
        </div>

        <p className="hero-eyebrow stagger-2">Your chart knows you</p>
        <h1 className="hero-title stagger-3">
          The stars,<br /><em>translated</em> for you
        </h1>
        <p className="hero-sub stagger-4">
          An AI that knows your natal chart as well as you know yourself. Not generic horoscopes — real, personal insight in conversation.
        </p>

        <div className="hero-ctas stagger-5">
          <Link href="/signup" className="btn btn-gold btn-xl">Begin your reading</Link>
          <a href="#how" className="btn btn-outline btn-lg">See how it works</a>
        </div>

        <div className="hero-social-proof stagger-5">
          <div className="avatars-stack">
            {["🌙", "⭐", "✦", "🌟"].map((e, i) => (
              <div key={e} className="av" style={{ background: `hsl(${240 + i * 20},35%,28%)` }}>{e}</div>
            ))}
          </div>
          <span><strong>2,400+ seekers</strong> in early access · 4.9 ★</span>
        </div>

        <div className="scroll-hint">
          <div className="scroll-hint-line" />
          <span>Scroll</span>
        </div>
      </section>

      <div className="section-divider" />

      <section className="landing-section" id="how">
        <div className="landing-wrap center">
          <p className="section-label">How it works</p>
          <h2 className="section-title">Three minutes to your<br /><em>first real insight</em></h2>
          <p className="section-sub">No lengthy setup. No generic content. Just your chart — and an AI that actually knows how to read it.</p>
        </div>
        <div className="landing-wrap">
          <div className="how-grid">
            {[
              { n: "01", icon: "🌍", title: "Enter your birth data", desc: "Date, time, and place. Astral computes your full natal chart: all planets, houses, and aspects — not just your sun sign." },
              { n: "02", icon: "💬", title: "Tell it what you're navigating", desc: "Career inflection, a relationship dynamic, a sense of being stuck. Three questions that frame your first conversation with intention." },
              { n: "03", icon: "✦", title: "Your chart comes alive", desc: "Astral opens with a message written for your specific placements and today's transits. Not a template. Your chart, right now." },
              { n: "04", icon: "🧠", title: "It remembers as you go", desc: "Mention a job situation, a person, a recurring fear. Astral carries that context forward — building a picture of your life over time." },
            ].map((step) => (
              <div key={step.n} className="how-step">
                <div className="how-num">{step.n}</div>
                <div className="how-icon">{step.icon}</div>
                <div className="how-title">{step.title}</div>
                <p className="how-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      <section className="landing-section" id="features">
        <div className="landing-wrap">
          <div className="center">
            <p className="section-label">Features</p>
            <h2 className="section-title">Everything your chart<br /><em>deserves</em></h2>
          </div>

          <div className="features-wrap">
            <div className="feature-row">
              <div className="feature-visual">
                <div className="feature-visual-inner">
                  <div className="fv-header">
                    <div className="fv-dot" style={{ background: "var(--gold)" }} />
                    <span className="fv-title">Chat · Saturn in 10th active</span>
                  </div>
                  <div className="chat-mock">
                    <div className="cm-msg cm-ai">
                      Saturn is still grinding through your 10th house. You&apos;re in the middle of a chapter that rewards building over speed.
                      <div className="cm-tag">♄ Saturn in 10th (ongoing)</div>
                    </div>
                    <div className="cm-msg cm-user">What does that mean for asking for a raise?</div>
                    <div className="cm-msg cm-ai">
                      Venus square Saturn in your natal chart means you habitually feel you need to earn the right to ask. But Mercury is exact on your Sun today — peak articulation. If not now, when?
                    </div>
                  </div>
                </div>
              </div>
              <div className="feature-copy">
                <p className="section-label">AI Chat</p>
                <h3 className="feature-h3">Your chart,<br /><em>in conversation</em></h3>
                <p className="feature-p">Every response is grounded in your specific placements and today&apos;s live transits. Not a lookup table — genuine synthesis, in real-time.</p>
                <div className="feature-points">
                  <div className="feature-point"><div className="fp-dot" />Full natal chart context on every message</div>
                  <div className="feature-point"><div className="fp-dot" />Live transit awareness, updated daily</div>
                  <div className="feature-point"><div className="fp-dot" />Aspect tags that explain the astrological reasoning</div>
                </div>
              </div>
            </div>

            <div className="feature-row flip">
              <div className="feature-visual">
                <div className="feature-visual-inner">
                  <div className="fv-header">
                    <div className="fv-dot" style={{ background: "var(--accent)" }} />
                    <span className="fv-title">Today&apos;s transits · May 21</span>
                  </div>
                  <div className="transit-mock">
                    <div className="tm-row">
                      <span className="tm-symbol">☿</span>
                      <div className="tm-info">
                        <div className="tm-name">Mercury conj. natal Sun</div>
                        <div className="tm-sub">Peak self-expression · exact today</div>
                      </div>
                      <span className="tm-orb">0.8°</span>
                    </div>
                    <div className="tm-row">
                      <span className="tm-symbol">♄</span>
                      <div className="tm-info">
                        <div className="tm-name">Saturn sq. natal Moon</div>
                        <div className="tm-sub">Emotional structure · ongoing</div>
                      </div>
                      <span className="tm-orb">2.1°</span>
                    </div>
                    <div className="tm-row">
                      <span className="tm-symbol">♃</span>
                      <div className="tm-info">
                        <div className="tm-name">Jupiter trine natal Mercury</div>
                        <div className="tm-sub">Expansive thinking · building</div>
                      </div>
                      <span className="tm-orb">4.2°</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="feature-copy">
                <p className="section-label">Live Transits</p>
                <h3 className="feature-h3">The sky <em>mapped<br />to your chart</em></h3>
                <p className="feature-p">Transits calculated fresh every day — only the ones active for your specific placements. Not the collective Mercury retrograde. Yours.</p>
                <div className="feature-points">
                  <div className="feature-point"><div className="fp-dot" />Personalized orb calculation per transit type</div>
                  <div className="feature-point"><div className="fp-dot" />Peak timing, duration, and intensity</div>
                  <div className="feature-point"><div className="fp-dot" />Daily briefing written around your active transits</div>
                </div>
              </div>
            </div>

            <div className="feature-row">
              <div className="feature-visual">
                <div className="feature-visual-inner">
                  <div className="fv-header">
                    <div className="fv-dot" style={{ background: "#7aacdc" }} />
                    <span className="fv-title">Memory · 4 entries</span>
                  </div>
                  <div className="memory-mock">
                    <div className="mm-item">
                      <span className="mm-cat mm-life">life event</span>
                      <span className="mm-text">New job in tech sales since March — still feels uncertain about the fit</span>
                    </div>
                    <div className="mm-item">
                      <span className="mm-cat mm-rel">relationship</span>
                      <span className="mm-text">Partner named Sam — stable but lacking spark recently</span>
                    </div>
                    <div className="mm-item">
                      <span className="mm-cat mm-theme">theme</span>
                      <span className="mm-text">Self-doubt before decisions, regret when not acting — recurring pattern</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="feature-copy">
                <p className="section-label">Memory Layer</p>
                <h3 className="feature-h3">It remembers<br /><em>your life</em></h3>
                <p className="feature-p">Tell Astral what&apos;s happening — it carries that context forward, session after session. After months, it knows you the way a good therapist does.</p>
                <div className="feature-points">
                  <div className="feature-point"><div className="fp-dot" />Extracts life events, relationships, and patterns automatically</div>
                  <div className="feature-point"><div className="fp-dot" />Referenced naturally, never robotically</div>
                  <div className="feature-point"><div className="fp-dot" />You can view and delete any memory, any time</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      <section className="landing-section landing-section-sm">
        <div className="landing-wrap center">
          <p className="section-label">Daily briefing</p>
          <h2 className="section-title">Your morning,<br /><em>written for your chart</em></h2>
          <p className="section-sub">A short, personal transit note — generated each morning for your specific sky, not the collective forecast.</p>

          <div className="briefing-demo">
            <div className="bd-header">
              <div className="bd-logo">
                ✦ ASTRAL <span className="bd-logo-sub">Daily</span>
              </div>
              <div className="bd-date">Thursday, May 21, 2026</div>
            </div>
            <div className="bd-body">
              <div className="bd-title">A window for honest words</div>
              <div className="bd-subtitle">Scorpio Sun · Mercury transit exact today</div>
              <div className="bd-text">
                Mercury sits within 0.8° of your natal Sun today — the closest it will be all year. For you, with Sun in Scorpio in the third house, communication is already your native currency. Today the exchange rate is especially favorable.
                <br /><br />
                Saturn continues its slow grind through your 10th house. The temptation is to wait until things feel more certain. Saturn rarely rewards waiting.
              </div>
              <div className="bd-pills">
                <div className="bd-pill"><div className="bd-pill-dot" />☿ Mercury conj. Sun · 0.8°</div>
                <div className="bd-pill"><div className="bd-pill-dot" />♄ Saturn in 10th</div>
                <div className="bd-pill"><div className="bd-pill-dot" />🌙 Moon → Taurus 4:22pm</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      <section className="landing-section">
        <div className="landing-wrap center">
          <p className="section-label">What people say</p>
          <h2 className="section-title">Not just <em>another<br />horoscope app</em></h2>
          <div className="testi-grid">
            {[
              { stars: true, text: <>I&apos;ve used every astrology app out there. Astral is the first one that made me feel like it actually <em>knows my chart</em> — not just my sun sign. The transit context in every message is wild.</>, name: "Sarah M.", meta: "Scorpio Sun · Virgo Rising", avatar: "S", hue: 260 },
              { stars: true, text: <>I was skeptical but the daily briefings hit different. It mentioned my Saturn return before I&apos;d even thought about it — and it was <em>exactly</em> describing what I&apos;m going through.</>, name: "Tomas R.", meta: "Capricorn Sun · Aquarius Moon", avatar: "T", hue: 200 },
              { stars: true, text: <>The relationship compatibility feature is genuinely useful. It&apos;s not just &quot;you&apos;re compatible&quot; — it explains the specific <em>dynamic</em> and how to navigate it. I use it for every important person in my life.</>, name: "Laila K.", meta: "Pisces Sun · Leo Rising", avatar: "L", hue: 320 },
            ].map((t) => (
              <div key={t.name} className="testi-card">
                <div className="testi-stars">★★★★★</div>
                <div className="testi-quote">&ldquo;</div>
                <p className="testi-text">{t.text}</p>
                <div className="testi-author">
                  <div className="testi-avatar" style={{ background: `hsl(${t.hue},35%,25%)` }}>{t.avatar}</div>
                  <div>
                    <div className="testi-name">{t.name}</div>
                    <div className="testi-meta">{t.meta}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      <section className="landing-section landing-section-sm">
        <div className="landing-wrap center">
          <p className="section-label">Why Astral</p>
          <h2 className="section-title">Not your <em>typical<br />astrology app</em></h2>
          <div className="comparison">
            <div className="comp-row">
              <div className="comp-header" />
              <div className="comp-header astral-col">✦ Astral</div>
              <div className="comp-header others-col">Others</div>
            </div>
            {[
              ["Personalized to your full natal chart", "✦", "Sun sign only"],
              ["Live transit-to-chart mapping", "✦", "Generic"],
              ["Conversational AI (ask anything)", "✦", "—"],
              ["Memory of your life context", "✦", "—"],
              ["Relationship synastry + chat", "✦", "Basic only"],
              ["Daily briefing personalized to your sky", "✦", "Collective forecast"],
            ].map(([feature, astral, others]) => (
              <div key={feature} className="comp-row">
                <div className="comp-cell feature-name">{feature}</div>
                <div className="comp-cell astral-col"><span className="check">{astral}</span></div>
                <div className="comp-cell others-col"><span className="cross">{others}</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      <section className="landing-section" id="pricing">
        <div className="landing-wrap center">
          <p className="section-label">Pricing</p>
          <h2 className="section-title">Start with <em>3 days free</em><br />No card required</h2>
          <p className="section-sub">Full access from day one. If it doesn&apos;t feel genuinely different from anything you&apos;ve used, just stop — we don&apos;t need your card to find out.</p>

          <div className="pricing-grid">
            <div className="pricing-card">
              <div className="pricing-label">Monthly</div>
              <div className="pricing-price"><sup>€</sup>9<sub>/month</sub></div>
              <div className="pricing-saving">&nbsp;</div>
              <div className="pricing-divider" />
              <div className="pricing-features">
                {["Unlimited AI chat", "Daily transit briefing", "Up to 3 relationship profiles", "Full conversation history", "Memory layer"].map((f) => (
                  <div key={f} className="pricing-feat"><span className="pricing-feat-check">✦</span>{f}</div>
                ))}
              </div>
              <Link href="/signup" className="btn btn-outline pricing-btn">Start free trial</Link>
            </div>
            <div className="pricing-card featured">
              <div className="pricing-badge">Best value</div>
              <div className="pricing-label">Annual</div>
              <div className="pricing-price"><sup>€</sup>59<sub>/year</sub></div>
              <div className="pricing-saving">Save 45% · €4.90/month</div>
              <div className="pricing-divider" />
              <div className="pricing-features">
                {["Everything in Monthly", "Weekly deep-dive AI report", "Unlimited relationship profiles", "Priority support", "Early access to new features"].map((f) => (
                  <div key={f} className="pricing-feat"><span className="pricing-feat-check">✦</span>{f}</div>
                ))}
              </div>
              <Link href="/signup" className="btn btn-gold pricing-btn">Start free trial →</Link>
            </div>
          </div>
          <p className="trial-note"><strong>3 days free</strong> · No credit card · Cancel any time</p>
        </div>
      </section>

      <div className="section-divider" />

      <section className="landing-section landing-section-sm" id="faq">
        <div className="landing-wrap center">
          <p className="section-label">Questions</p>
          <h2 className="section-title">The ones <em>people ask</em></h2>
        </div>
        <div className="landing-wrap">
          <LandingFaq />
        </div>
      </section>

      <div className="section-divider" />

      <section className="cta-section">
        <div className="cta-glow" />
        <div className="pill">✦ 3 days free · no card required</div>
        <h2 className="cta-h2">Your chart has been<br /><em>waiting to speak</em></h2>
        <p className="cta-p">Three minutes from now, you could be in a real conversation with your natal chart — about your life, right now.</p>
        <Link href="/signup" className="btn btn-gold btn-xl">Begin your reading →</Link>
        <p className="cta-footnote">Join 2,400+ people already using Astral in early access</p>
      </section>

      <footer className="landing-footer">
        <div className="footer-logo">✦ ASTRAL</div>
        <div className="footer-links">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Contact</a>
          <a href="#">Twitter</a>
          <a href="#">Instagram</a>
        </div>
        <div className="footer-copy">© 2026 Astral. All rights reserved.</div>
      </footer>
    </>
  );
}
