"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface RelProfile { id: string; name: string; birth_date: string; birth_location: string | null }

export default function RelationshipsPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<RelProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthLocation, setBirthLocation] = useState("");

  useEffect(() => {
    fetch("/api/relationships")
      .then(r => r.json())
      .then(d => { setProfiles(d.profiles ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !birthDate) return;
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/relationships", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, birthDate, birthTime: birthTime || undefined, birthLocation: birthLocation || undefined }),
    });

    if (res.status === 402) {
      setLimitReached(true);
      setSubmitting(false);
      return;
    }

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Something went wrong.");
      setSubmitting(false);
      return;
    }

    const { profile } = await res.json() as { profile: RelProfile };
    setProfiles(prev => [profile, ...prev]);
    setShowForm(false);
    setName(""); setBirthDate(""); setBirthTime(""); setBirthLocation("");
    setSubmitting(false);
    router.push(`/relationships/${profile.id}`);
  };

  return (
    <div className="rel-screen screen">
      <div className="rel-inner">

        {/* Header */}
        <div style={{ marginBottom: "28px", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <div className="section-label">Relationships</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "32px", fontWeight: 300, margin: 0 }}>Your people</h2>
          </div>
          {!showForm && (
            <button
              className="btn btn-outline btn-sm"
              onClick={() => { setShowForm(true); setLimitReached(false); }}
            >
              + Add person
            </button>
          )}
        </div>

        {/* Paywall notice */}
        <div style={{ marginBottom: "20px", padding: "12px 16px", background: "var(--void)", border: "1px solid var(--border)", borderRadius: "var(--r)", display: "flex", alignItems: "center", gap: "12px" }}>
          <span>🔒</span>
          <div style={{ fontSize: "13px", color: "var(--muted)" }}>
            Free plan: 1 profile · Paid: 3 profiles.{" "}
          </div>
        </div>

        {/* Limit reached */}
        {limitReached && (
          <div style={{ marginBottom: "20px", padding: "14px 16px", background: "var(--void)", border: "1px solid var(--gold-dim, #c9a96e44)", borderRadius: "var(--r)", color: "var(--gold)", fontSize: "13px" }}>
            ✦ You&apos;ve reached your profile limit. Upgrade to add more relationships.
          </div>
        )}

        {/* Add form */}
        {showForm && (
          <form onSubmit={handleSubmit} style={{ marginBottom: "28px", padding: "20px", background: "var(--void)", border: "1px solid var(--border2)", borderRadius: "var(--r)" }}>
            <div style={{ fontSize: "14px", fontWeight: 500, marginBottom: "16px" }}>New relationship profile</div>

            {error && <div style={{ color: "#e06c75", fontSize: "13px", marginBottom: "12px" }}>{error}</div>}

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label className="label">Name *</label>
                <input
                  className="input"
                  type="text"
                  placeholder="e.g. Alex, Mom, David"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">Birth date *</label>
                <input
                  className="input"
                  type="date"
                  value={birthDate}
                  onChange={e => setBirthDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">Birth time <span style={{ opacity: 0.5, textTransform: "none", letterSpacing: 0 }}>(optional — improves accuracy)</span></label>
                <input
                  className="input"
                  type="time"
                  value={birthTime}
                  onChange={e => setBirthTime(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Birth city <span style={{ opacity: 0.5, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
                <input
                  className="input"
                  type="text"
                  placeholder="e.g. London, Paris, New York"
                  value={birthLocation}
                  onChange={e => setBirthLocation(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button type="submit" className="btn btn-gold" disabled={submitting || !name || !birthDate}>
                {submitting ? (
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className="typing-dots" style={{ display: "inline-flex" }}><span /><span /><span /></span>
                    Generating report…
                  </span>
                ) : "Generate compatibility report"}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => { setShowForm(false); setError(null); }}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Profiles list */}
        {loading ? (
          <div style={{ color: "var(--muted)", fontSize: "14px" }}>Loading…</div>
        ) : profiles.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", opacity: 0.5 }}>
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>💕</div>
            <div style={{ fontSize: "14px", color: "var(--muted)" }}>
              Add someone to explore your synastry.
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {profiles.map(p => (
              <div
                key={p.id}
                className="sidebar-item"
                style={{ cursor: "pointer", padding: "14px 16px" }}
                onClick={() => router.push(`/relationships/${p.id}`)}
              >
                <span className="sidebar-item-icon">💕</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "14px", fontWeight: 500 }}>{p.name}</div>
                  <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>
                    {p.birth_date}{p.birth_location ? ` · ${p.birth_location}` : ""}
                  </div>
                </div>
                <span style={{ color: "var(--muted)", fontSize: "16px" }}>›</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
