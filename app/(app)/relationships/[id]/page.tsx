"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

interface RelProfile {
  id: string;
  name: string;
  birth_date: string;
  birth_time?: string;
  birth_location?: string;
}

interface Message { id: string; role: "user" | "assistant"; content: string; created_at?: string }

export default function RelationshipDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [profile, setProfile] = useState<RelProfile | null>(null);
  const [report, setReport] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showReport, setShowReport] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const messagesEnd = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetch(`/api/relationships/${id}`)
      .then(r => r.json())
      .then(data => {
        if (!data.profile) { router.push("/relationships"); return; }
        setProfile(data.profile);
        setReport(data.report ?? null);
        setConversationId(data.conversationId ?? null);
        setLoading(false);
        if (data.conversationId) loadMessages(data.conversationId);
      })
      .catch(() => { router.push("/relationships"); });
  }, [id]);

  const loadMessages = async (convId: string) => {
    const res = await fetch(`/api/conversations/${convId}/messages`);
    if (!res.ok) return;
    const { messages: msgs } = await res.json() as { messages: Message[] };
    setMessages(msgs ?? []);
  };

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || !conversationId || isLoading) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    abortRef.current = new AbortController();

    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) { setIsLoading(false); return; }

      const assistantId = `a-${Date.now()}`;
      setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "" }]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages(prev => prev.map(m =>
          m.id === assistantId ? { ...m, content: m.content + chunk } : m
        ));
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") console.error("Chat error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete ${profile?.name}? This cannot be undone.`)) return;
    setDeleting(true);
    await fetch(`/api/relationships/${id}`, { method: "DELETE" });
    router.push("/relationships");
  };

  const formatReport = (text: string) => {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("**") && line.endsWith("**")) {
        return <div key={i} style={{ fontWeight: 600, color: "var(--text)", marginTop: i === 0 ? 0 : "20px", marginBottom: "6px", fontSize: "14px" }}>{line.replace(/\*\*/g, "")}</div>;
      }
      if (line.trim() === "") return null;
      return <p key={i} style={{ margin: "0 0 8px", lineHeight: "1.7", color: "var(--muted)", fontSize: "14px" }}>{line}</p>;
    });
  };

  if (loading) {
    return (
      <div className="screen" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="typing-dots"><span /><span /><span /></div>
      </div>
    );
  }

  return (
    <div className="chat-layout screen">
      {/* Left panel — report */}
      <div className="chat-sidebar" style={{ width: "320px", display: "flex", flexDirection: "column", overflowY: "auto" }}>
        <div style={{ padding: "20px 20px 0" }}>
          <button
            style={{ background: "none", border: "none", color: "var(--muted)", fontSize: "12px", cursor: "pointer", padding: 0, marginBottom: "16px" }}
            onClick={() => router.push("/relationships")}
          >
            ← Back
          </button>
          <div style={{ fontSize: "11px", letterSpacing: "3px", color: "var(--gold)", textTransform: "uppercase", marginBottom: "4px" }}>Synastry</div>
          <div style={{ fontSize: "22px", fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, marginBottom: "4px" }}>{profile?.name}</div>
          <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "20px" }}>
            {profile?.birth_date}{profile?.birth_location ? ` · ${profile.birth_location}` : ""}
          </div>
        </div>

        {report && (
          <div style={{ padding: "0 20px", flex: 1 }}>
            <button
              style={{ background: "none", border: "none", color: "var(--gold)", fontSize: "12px", cursor: "pointer", padding: "0 0 12px", letterSpacing: "1px" }}
              onClick={() => setShowReport(v => !v)}
            >
              {showReport ? "▾ Compatibility report" : "▸ Compatibility report"}
            </button>
            {showReport && (
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
                {formatReport(report)}
              </div>
            )}
          </div>
        )}

        <div style={{ padding: "20px", marginTop: "auto" }}>
          <button
            className="btn btn-ghost btn-sm"
            style={{ color: "var(--muted)", fontSize: "12px", width: "100%" }}
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting…" : "Delete profile"}
          </button>
        </div>
      </div>

      {/* Right panel — scoped chat */}
      <div className="chat-main">
        <div className="chat-header">
          <div className="chat-header-info">
            <div className="chat-header-title">Chat about {profile?.name}</div>
            <div className="chat-header-sub">Synastry-grounded · how to navigate this dynamic</div>
          </div>
        </div>

        <div className="messages-area">
          {messages.length === 0 && (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--muted)", fontSize: "14px" }}>
              <div style={{ marginBottom: "16px", fontSize: "28px", opacity: 0.4 }}>💕</div>
              Ask anything about your dynamic with {profile?.name}. The AI has their chart and your synastry aspects in context.
            </div>
          )}
          {messages.map(m => (
            <div key={m.id} className={`msg-row ${m.role}`}>
              <div className={`msg-avatar ${m.role}`}>{m.role === "assistant" ? "✦" : "✶"}</div>
              <div className={`msg-bubble ${m.role}`}>{m.content}</div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="msg-row assistant">
              <div className="msg-avatar assistant">✦</div>
              <div className="msg-bubble assistant">
                <div className="typing-dots"><span /><span /><span /></div>
              </div>
            </div>
          )}
          <div ref={messagesEnd} />
        </div>

        <div className="suggested-prompts">
          {[
            `What's the most significant dynamic between me and ${profile?.name}?`,
            `Where is the friction coming from?`,
            `How can I communicate better with ${profile?.name}?`,
            `What does this relationship bring out in me?`,
          ].map((c, i) => (
            <div key={i} className="prompt-chip" onClick={() => sendMessage(c)}>{c}</div>
          ))}
        </div>

        <form onSubmit={e => { e.preventDefault(); sendMessage(input); }}>
          <div className="chat-input-area">
            <div className="chat-input-wrap">
              <textarea
                className="chat-textarea"
                rows={1}
                placeholder={`Ask about your dynamic with ${profile?.name}…`}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              />
              <button className="send-btn" type="submit" disabled={isLoading || !input.trim()}>➤</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
