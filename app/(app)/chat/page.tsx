"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useDrawer } from "@/lib/useDrawer";

interface Conversation { id: string; title: string; updated_at: string }
interface Message { id: string; role: "user" | "assistant"; content: string; created_at?: string }
interface RelProfile { id: string; name: string }

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [briefingText, setBriefingText] = useState<string | null>(null);
  const [showBriefing, setShowBriefing] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallPlan, setPaywallPlan] = useState("annual");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [relProfiles, setRelProfiles] = useState<RelProfile[]>([]);
  const messagesEnd = useRef<HTMLDivElement>(null);
  const messagesTop = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const closeSidebar = () => setSidebarOpen(false);
  useDrawer(sidebarOpen, closeSidebar);

  useEffect(() => {
    (async () => {
      const [convRes, promptsRes, briefingRes, relRes] = await Promise.all([
        supabase.from("conversations").select("id, title, updated_at").is("relationship_profile_id", null).order("updated_at", { ascending: false }),
        fetch("/api/chat/suggested-prompts"),
        fetch("/api/briefing/today"),
        fetch("/api/relationships"),
      ]);
      const { data } = convRes;
      if (!data?.length) { router.push("/onboarding"); return; }
      setConversations(data);

      if (searchParams.get("new") === "true") {
        setActiveId(null);
        setMessages([]);
      } else {
        setActiveId(data[0].id);
      }

      if (promptsRes.ok) {
        const { prompts } = await promptsRes.json() as { prompts: string[] };
        if (Array.isArray(prompts)) setSuggestedPrompts(prompts);
      }

      if (briefingRes.ok) {
        const { briefing } = await briefingRes.json() as { briefing?: string };
        if (briefing) setBriefingText(briefing);
      }

      if (relRes.ok) {
        const { profiles } = await relRes.json() as { profiles?: RelProfile[] };
        if (Array.isArray(profiles)) setRelProfiles(profiles);
      }
    })();
  }, []);

  useEffect(() => {
    if (!activeId) return;
    (async () => {
      const res = await fetch(`/api/conversations/${activeId}/messages`);
      if (!res.ok) return;
      const { messages: msgs, hasMore: more } = await res.json() as { messages: Message[]; hasMore: boolean };
      setMessages(msgs ?? []);
      setHasMore(more ?? false);
    })();
  }, [activeId]);

  const loadOlderMessages = async () => {
    if (!activeId || !hasMore || loadingMore || !messages.length) return;
    setLoadingMore(true);
    const oldest = messages[0].created_at;
    const res = await fetch(
      `/api/conversations/${activeId}/messages${oldest ? `?before=${encodeURIComponent(oldest)}` : ""}`
    );
    if (!res.ok) { setLoadingMore(false); return; }
    const { messages: older, hasMore: more } = await res.json() as { messages: Message[]; hasMore: boolean };
    setMessages(prev => [...(older ?? []), ...prev]);
    setHasMore(more ?? false);
    setLoadingMore(false);
    // Keep scroll position after prepend
    messagesTop.current?.scrollIntoView({ block: "start" });
  };

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    let convId = activeId;
    if (!convId) {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New conversation" }),
      });
      const { conversation } = await res.json();
      setConversations(prev => [conversation, ...prev]);
      setActiveId(conversation.id);
      convId = conversation.id;
    }

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    abortRef.current = new AbortController();

    try {
      const res = await fetch(`/api/conversations/${convId}/messages`, {
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
      // Refresh conversation list only when this was the first user message
      // (title auto-generation happens server-side, so we need to pull the new title)
      const wasFirstMessage = !messages.some(m => m.role === "user");
      if (wasFirstMessage) {
        const { data: updatedConvs } = await supabase
          .from("conversations")
          .select("id, title, updated_at")
          .order("updated_at", { ascending: false });
        if (updatedConvs) setConversations(updatedConvs);
      } else {
        // Just bump the updated_at timestamp in local state for sort ordering
        setConversations(prev =>
          prev.map(c =>
            c.id === convId ? { ...c, updated_at: new Date().toISOString() } : c
          ).sort((a, b) => b.updated_at.localeCompare(a.updated_at))
        );
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

  const handleNewConversation = () => {
    setActiveId(null);
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
        <div className="sidebar-section">Relationships</div>
        {relProfiles.map(p => (
          <Link key={p.id} href={`/relationships/${p.id}`} className="sidebar-item" onClick={closeSidebar}>
            <span className="sidebar-item-icon">💕</span>
            <span className="sidebar-item-text">{p.name}</span>
          </Link>
        ))}
        <Link href="/relationships" className="sidebar-item" onClick={closeSidebar}>
          <span className="sidebar-item-icon">＋</span>
          <span className="sidebar-item-text" style={{ color: "var(--muted)" }}>Add person</span>
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

        {showBriefing && briefingText && (
          <div className="transit-card">
            <div className="transit-card-icon">✦</div>
            <div className="transit-card-content">
              <div className="transit-card-label">
                Today&apos;s sky report ·{" "}
                <Link href="/briefing" style={{ color: "var(--gold)", textDecoration: "underline", fontSize: "inherit" }}>
                  Full briefing
                </Link>
              </div>
              <div className="transit-card-text">{briefingText}</div>
            </div>
            <button className="transit-card-close" onClick={() => setShowBriefing(false)}>×</button>
          </div>
        )}

        <div className="messages-area">
          <div ref={messagesTop} />
          {hasMore && (
            <div style={{ textAlign: "center", padding: "12px 0" }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={loadOlderMessages}
                disabled={loadingMore}
                style={{ fontSize: "12px", color: "var(--muted)" }}
              >
                {loadingMore ? "Loading…" : "Load older messages"}
              </button>
            </div>
          )}
          {messages.map((m) => (
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

        {suggestedPrompts.length > 0 && !messages.some(m => m.role === "user") && (
          <div className="suggested-prompts">
            {suggestedPrompts.map((c, i) => (
              <div key={i} className="prompt-chip" onClick={() => sendMessage(c)}>{c}</div>
            ))}
          </div>
        )}

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
