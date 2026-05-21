"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useDrawer } from "@/lib/useDrawer";

interface Conversation { id: string; title: string; updated_at: string }
interface Message { id: string; role: "user" | "assistant"; content: string }

const CHIPS = [
  "What's the most important transit for me this month?",
  "How does my chart handle conflict?",
  "What does my Venus placement say about love?",
  "Best timing for a big decision right now?",
];

export default function ChatPage() {
  const router = useRouter();
  const supabase = createClient();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showTransit, setShowTransit] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallPlan, setPaywallPlan] = useState("annual");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEnd = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const closeSidebar = () => setSidebarOpen(false);
  useDrawer(sidebarOpen, closeSidebar);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("conversations")
        .select("id, title, updated_at")
        .order("updated_at", { ascending: false });
      if (!data?.length) { router.push("/onboarding"); return; }
      setConversations(data);
      setActiveId(data[0].id);
    })();
  }, []);

  useEffect(() => {
    if (!activeId) return;
    (async () => {
      const res = await fetch(`/api/conversations/${activeId}/messages`);
      if (!res.ok) return;
      const { messages: msgs } = await res.json() as { messages: Message[] };
      setMessages(msgs ?? []);
    })();
  }, [activeId]);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || !activeId || isLoading) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    abortRef.current = new AbortController();

    try {
      const res = await fetch(`/api/conversations/${activeId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
        signal: abortRef.current.signal,
      });

      if (res.status === 402) {
        setShowPaywall(true);
        setMessages(prev => prev.filter(m => m.id !== userMsg.id));
        setIsLoading(false);
        return;
      }

      if (!res.ok || !res.body) {
        setIsLoading(false);
        return;
      }

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
      if ((err as Error).name !== "AbortError") {
        console.error("Chat error:", err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    sendMessage(input);
  };

  const handleNewConversation = async () => {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New conversation" }),
    });
    const { conversation } = await res.json();
    setConversations(prev => [conversation, ...prev]);
    setActiveId(conversation.id);
    setMessages([]);
    closeSidebar();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const activeConv = conversations.find(c => c.id === activeId);

  return (
    <div className="chat-layout screen">
      {showPaywall && (
        <div className="paywall-overlay" onClick={() => setShowPaywall(false)}>
          <div className="paywall-card" onClick={e => e.stopPropagation()}>
            <div className="paywall-glow" />
            <div className="paywall-icon">✦</div>
            <h2 className="paywall-title">Your trial has ended</h2>
            <p className="paywall-sub">Continue your reading — your chart context and history are saved.</p>
            <div className="plans">
              <div className="plan" onClick={() => setPaywallPlan("monthly")} style={{ borderColor: paywallPlan === "monthly" ? "var(--border2)" : "var(--border)" }}>
                <div className="plan-price">€9<span>/mo</span></div>
                <div className="plan-label">Monthly</div>
              </div>
              <div className="plan featured" onClick={() => setPaywallPlan("annual")}>
                <div className="plan-badge">Best value</div>
                <div className="plan-price">€59<span>/yr</span></div>
                <div className="plan-label">Annual · €4.9/mo</div>
              </div>
            </div>
            <div className="paywall-features">
              {["Unlimited AI chat with your chart", "Daily personalized transit briefing", "Up to 3 relationship profiles", "Full conversation history & memory"].map((f, i) => (
                <div key={i} className="paywall-feature"><span className="paywall-feature-check">✦</span><span>{f}</span></div>
              ))}
            </div>
            <button className="btn btn-gold btn-full" style={{ marginBottom: "10px" }}>
              Start for {paywallPlan === "annual" ? "€59/year" : "€9/month"} →
            </button>
            <button className="btn btn-ghost btn-full" onClick={() => setShowPaywall(false)} style={{ fontSize: "13px" }}>Maybe later</button>
          </div>
        </div>
      )}

      {sidebarOpen && (
        <div className="drawer-backdrop" onClick={closeSidebar} aria-hidden="true" />
      )}

      {/* Sidebar */}
      <div className={`chat-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-top">
          <button className="btn btn-outline btn-sm btn-full" onClick={handleNewConversation}>+ New conversation</button>
        </div>
        <div className="sidebar-section">Today&apos;s sky</div>
        <Link href="/briefing" className="sidebar-item" onClick={closeSidebar}>
          <span className="sidebar-item-icon">🌙</span>
          <span className="sidebar-item-text">Daily briefing</span>
          <span className="sidebar-item-badge">New</span>
        </Link>
        <div className="sidebar-section">Conversations</div>
        {conversations.map((c) => (
          <div
            key={c.id}
            className={`sidebar-item ${c.id === activeId ? "active" : ""}`}
            onClick={() => { setActiveId(c.id); closeSidebar(); }}
          >
            <span className="sidebar-item-icon">💬</span>
            <span className="sidebar-item-text">{c.title}</span>
          </div>
        ))}
        <div className="sidebar-section">People</div>
        <Link href="/relationships" className="sidebar-item" onClick={closeSidebar}>
          <span className="sidebar-item-icon">💕</span>
          <span className="sidebar-item-text">Relationships</span>
        </Link>
        <div style={{ flex: 1 }} />
      </div>

      {/* Main */}
      <div className="chat-main">
        <div className="chat-header">
          <button
            type="button"
            className="chat-sidebar-burger"
            onClick={() => setSidebarOpen(o => !o)}
            aria-label={sidebarOpen ? "Close conversations" : "Open conversations"}
            aria-expanded={sidebarOpen}
          >
            <span className="burger-icon" aria-hidden="true"><span /><span /><span /></span>
          </button>
          <div className="chat-header-info">
            <div className="chat-header-title">{activeConv?.title ?? "Your reading"}</div>
            <div className="chat-header-sub">Personalized to your natal chart · live transit context</div>
          </div>
          <div className="chat-header-actions">
            <div className="badge badge-gold">Trial · 3 days</div>
          </div>
        </div>

        {showTransit && (
          <div className="transit-card">
            <div className="transit-card-icon">✦</div>
            <div className="transit-card-content">
              <div className="transit-card-label">Live transit context active</div>
              <div className="transit-card-text">Today&apos;s sky is mapped to your natal chart. Every response reflects what&apos;s active for you right now.</div>
            </div>
            <button className="transit-card-close" onClick={() => setShowTransit(false)}>×</button>
          </div>
        )}

        <div className="messages-area">
          {messages.map((m) => (
            <div key={m.id} className={`msg-row ${m.role}`}>
              <div className={`msg-avatar ${m.role}`}>{m.role === "assistant" ? "✦" : "✶"}</div>
              <div>
                <div className={`msg-bubble ${m.role}`}>{m.content}</div>
              </div>
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
          {CHIPS.map((c, i) => (
            <div key={i} className="prompt-chip" onClick={() => setInput(c)}>{c}</div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="chat-input-area">
            <div className="chat-input-wrap">
              <textarea
                className="chat-textarea"
                rows={1}
                placeholder="Ask anything about your chart…"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={onKeyDown}
              />
              <button
                className="send-btn"
                type="submit"
                disabled={isLoading || !input.trim()}
              >
                ➤
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
