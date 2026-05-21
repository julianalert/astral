"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Memory { id: string; content: string; category: string }
interface Chart { birth_date: string; birth_time: string; birth_location: string }

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [chart, setChart] = useState<Chart | null>(null);
  const [email, setEmail] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setEmail(user?.email ?? "");

      const { data: m } = await supabase.from("memories").select("id, content, category").eq("user_id", user?.id).order("created_at", { ascending: false });
      setMemories(m ?? []);

      const { data: c } = await supabase.from("natal_charts").select("birth_date, birth_time, birth_location").eq("user_id", user?.id).single();
      setChart(c);
    })();
  }, []);

  const deleteMemory = async (id: string) => {
    await supabase.from("memories").delete().eq("id", id);
    setMemories(prev => prev.filter(m => m.id !== id));
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="settings-screen screen">
      <div className="settings-inner">
        <h1 className="settings-title">Settings</h1>

        <div className="sub-card">
          <div className="sub-icon">✦</div>
          <div className="sub-info">
            <div className="sub-name">Astral · Trial</div>
            <div className="sub-detail">3-day free trial · No card required</div>
          </div>
          <button className="btn btn-outline btn-sm">Upgrade</button>
        </div>

        {chart && (
          <div className="settings-section">
            <div className="settings-section-title">Birth data</div>
            {[
              { label: "Date of birth", val: chart.birth_date },
              { label: "Time of birth", val: chart.birth_time },
              { label: "Place of birth", val: chart.birth_location },
            ].map((r, i) => (
              <div key={i} className="settings-row">
                <div><div className="settings-row-label">{r.label}</div></div>
                <div className="settings-row-right">{r.val}</div>
              </div>
            ))}
          </div>
        )}

        <div className="settings-section">
          <div className="settings-section-title">Account</div>
          <div className="settings-row">
            <div><div className="settings-row-label">Email</div></div>
            <div className="settings-row-right">{email}</div>
          </div>
          <div className="settings-row" onClick={signOut} style={{ cursor: "pointer" }}>
            <div><div className="settings-row-label">Sign out</div></div>
            <div className="settings-row-right" style={{ color: "var(--gold)" }}>→</div>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-section-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Astral&apos;s memory of you</span>
            <span style={{ color: "var(--muted2)", fontSize: "11px", textTransform: "none", letterSpacing: "normal" }}>{memories.length} entries</span>
          </div>
          {memories.length === 0 ? (
            <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.6 }}>No memories yet — Astral will build these from your conversations.</p>
          ) : (
            <>
              <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "14px", lineHeight: 1.6 }}>Astral builds this from your conversations. Delete anything you&apos;d rather it forget.</p>
              {memories.map(m => (
                <div key={m.id} className="memory-item">
                  <span className={`memory-cat ${m.category}`}>{m.category.replace("_", " ")}</span>
                  <span className="memory-text">{m.content}</span>
                  <button className="memory-delete" onClick={() => deleteMemory(m.id)}>×</button>
                </div>
              ))}
            </>
          )}
        </div>

        <div className="settings-section">
          <button className="btn btn-outline btn-full" style={{ color: "#e07a6a", borderColor: "rgba(224,122,106,0.3)" }}>
            Delete account
          </button>
        </div>
      </div>
    </div>
  );
}
