import Link from "next/link";

export default function RelationshipsPage() {
  return (
    <div className="rel-screen screen">
      <div className="rel-inner">
        <div style={{ marginBottom: "28px" }}>
          <div className="section-label">Relationships</div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "32px", fontWeight: 300 }}>Your people</h2>
        </div>

        <div className="rel-add-card">
          <div style={{ fontSize: "22px" }}>+</div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 500 }}>Add a person</div>
            <div style={{ fontSize: "12px", marginTop: "2px" }}>Relationship compatibility coming in Sprint 5</div>
          </div>
        </div>

        <div style={{ marginTop: "20px", padding: "14px 16px", background: "var(--void)", border: "1px solid var(--border)", borderRadius: "var(--r)", display: "flex", alignItems: "center", gap: "12px" }}>
          <span>🔒</span>
          <div style={{ fontSize: "13px", color: "var(--muted)" }}>
            Free plan includes 1 relationship profile.{" "}
            <span style={{ color: "var(--gold)", cursor: "pointer" }}>Upgrade for unlimited.</span>
          </div>
        </div>

        <div style={{ marginTop: "32px", textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: "36px", marginBottom: "12px", opacity: 0.5 }}>💕</div>
          <div style={{ fontSize: "14px", color: "var(--muted)" }}>
            For now, you can ask Seraphova about anyone in the chat.
          </div>
          <Link href="/chat" className="btn btn-outline btn-sm" style={{ marginTop: "16px", display: "inline-flex" }}>
            Go to chat
          </Link>
        </div>
      </div>
    </div>
  );
}
