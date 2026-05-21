"use client";

import { useState, useEffect, useRef } from "react";

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  :root {
    --night:    #08090f;
    --deep:     #0d0f1a;
    --void:     #111422;
    --card:     #161929;
    --border:   rgba(255,255,255,0.07);
    --border2:  rgba(255,255,255,0.12);
    --gold:     #c9a84c;
    --gold2:    #e8c97a;
    --gold-dim: rgba(201,168,76,0.15);
    --text:     #e8e4da;
    --muted:    rgba(232,228,218,0.45);
    --muted2:   rgba(232,228,218,0.25);
    --accent:   #7b6fa0;
    --r: 8px;
    --r2: 14px;
  }

  html, body { height: 100%; background: var(--night); color: var(--text); font-family: 'DM Sans', sans-serif; font-size: 15px; }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

  /* Stars canvas */
  .stars-canvas { position: fixed; inset: 0; pointer-events: none; z-index: 0; opacity: 0.6; }

  /* Layout */
  .app { position: relative; z-index: 1; height: 100vh; display: flex; flex-direction: column; }

  /* ── TRANSITIONS ── */
  .screen { animation: fadeUp 0.45s cubic-bezier(.22,1,.36,1) both; }
  @keyframes fadeUp { from { opacity:0; transform: translateY(18px); } to { opacity:1; transform: none; } }

  .stagger-1 { animation-delay: 0.05s; }
  .stagger-2 { animation-delay: 0.12s; }
  .stagger-3 { animation-delay: 0.19s; }
  .stagger-4 { animation-delay: 0.26s; }
  .stagger-5 { animation-delay: 0.33s; }

  /* ── NAV ── */
  .nav {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 28px;
    border-bottom: 1px solid var(--border);
    background: rgba(8,9,15,0.85);
    backdrop-filter: blur(20px);
    position: sticky; top: 0; z-index: 100;
    flex-shrink: 0;
  }
  .nav-logo { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 400; letter-spacing: 0.12em; color: var(--gold2); display: flex; align-items: center; gap: 8px; cursor: pointer; }
  .nav-logo span { font-size: 18px; }
  .nav-tabs { display: flex; gap: 2px; background: var(--void); border-radius: 8px; padding: 3px; }
  .nav-tab { padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 400; color: var(--muted); cursor: pointer; transition: all 0.2s; border: none; background: none; letter-spacing: 0.02em; }
  .nav-tab.active { background: var(--card); color: var(--text); }
  .nav-tab:hover:not(.active) { color: var(--text); }
  .nav-right { display: flex; align-items: center; gap: 12px; }
  .avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, var(--accent), var(--gold)); display: flex; align-items: center; justify-content: center; font-size: 13px; cursor: pointer; flex-shrink: 0; }

  /* ── BUTTONS ── */
  .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 11px 24px; border-radius: var(--r); font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; border: none; letter-spacing: 0.02em; }
  .btn-gold { background: linear-gradient(135deg, var(--gold), var(--gold2)); color: #0d0f1a; }
  .btn-gold:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(201,168,76,0.3); }
  .btn-outline { background: transparent; border: 1px solid var(--border2); color: var(--text); }
  .btn-outline:hover { border-color: var(--gold); color: var(--gold); }
  .btn-ghost { background: transparent; color: var(--muted); border: none; padding: 8px 12px; }
  .btn-ghost:hover { color: var(--text); }
  .btn-sm { padding: 7px 16px; font-size: 13px; }
  .btn-full { width: 100%; }
  .btn-icon { width: 36px; height: 36px; padding: 0; border-radius: 50%; }

  /* ── INPUTS ── */
  .input { width: 100%; background: var(--void); border: 1px solid var(--border); border-radius: var(--r); padding: 11px 14px; color: var(--text); font-family: 'DM Sans', sans-serif; font-size: 14px; outline: none; transition: border-color 0.2s; }
  .input:focus { border-color: rgba(201,168,76,0.4); }
  .input::placeholder { color: var(--muted2); }
  .label { font-size: 12px; font-weight: 500; color: var(--muted); letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 6px; display: block; }

  /* ── CARDS ── */
  .card { background: var(--card); border: 1px solid var(--border); border-radius: var(--r2); padding: 20px; }
  .card-glass { background: rgba(22,25,41,0.6); backdrop-filter: blur(16px); border: 1px solid var(--border); border-radius: var(--r2); padding: 20px; }

  /* ── DIVIDER ── */
  .divider { height: 1px; background: var(--border); margin: 20px 0; }
  .divider-text { display: flex; align-items: center; gap: 12px; color: var(--muted2); font-size: 12px; margin: 16px 0; }
  .divider-text::before, .divider-text::after { content:''; flex:1; height:1px; background: var(--border); }

  /* ─────────────────────────────────────────────── */
  /* LANDING */
  /* ─────────────────────────────────────────────── */
  .landing { flex: 1; overflow-y: auto; }
  .landing-hero { min-height: 88vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 60px 24px; position: relative; }
  .hero-glow { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-60%); width: 600px; height: 600px; background: radial-gradient(ellipse, rgba(123,111,160,0.12) 0%, transparent 70%); pointer-events: none; }
  .hero-orbit { width: 280px; height: 280px; border: 1px solid rgba(201,168,76,0.12); border-radius: 50%; display: flex; align-items: center; justify-content: center; position: relative; margin: 0 auto 48px; animation: slowSpin 40s linear infinite; }
  .hero-orbit::before { content:''; position: absolute; width: 200px; height: 200px; border: 1px solid rgba(201,168,76,0.08); border-radius: 50%; }
  .hero-orbit-dot { position: absolute; top: -4px; left: 50%; transform: translateX(-50%); width: 8px; height: 8px; border-radius: 50%; background: var(--gold); box-shadow: 0 0 12px var(--gold); }
  .hero-center { width: 80px; height: 80px; border-radius: 50%; background: radial-gradient(circle at 35% 35%, #c9a84c, #7b6fa0); display: flex; align-items: center; justify-content: center; font-size: 32px; animation: counterSpin 40s linear infinite; box-shadow: 0 0 40px rgba(201,168,76,0.2); }
  @keyframes slowSpin { to { transform: rotate(360deg); } }
  @keyframes counterSpin { to { transform: rotate(-360deg); } }
  .hero-eyebrow { font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); margin-bottom: 20px; }
  .hero-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(48px, 8vw, 84px); font-weight: 300; line-height: 1.0; color: var(--text); margin-bottom: 20px; }
  .hero-title em { font-style: italic; color: var(--gold2); }
  .hero-sub { font-size: 16px; color: var(--muted); max-width: 420px; line-height: 1.65; margin-bottom: 40px; }
  .hero-ctas { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; }
  .hero-social-proof { margin-top: 56px; display: flex; align-items: center; gap: 16px; color: var(--muted2); font-size: 13px; }
  .avatars-stack { display: flex; }
  .avatars-stack .av { width: 28px; height: 28px; border-radius: 50%; border: 2px solid var(--deep); margin-left: -8px; }
  .avatars-stack .av:first-child { margin-left: 0; }

  .features-section { padding: 80px 24px; max-width: 900px; margin: 0 auto; }
  .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; margin-top: 40px; }
  .feature-card { padding: 28px; border: 1px solid var(--border); border-radius: var(--r2); background: linear-gradient(135deg, var(--card), var(--void)); position: relative; overflow: hidden; }
  .feature-card::before { content:''; position:absolute; top:0; left:0; right:0; height:1px; background: linear-gradient(90deg, transparent, var(--gold-dim), transparent); }
  .feature-icon { font-size: 28px; margin-bottom: 16px; }
  .feature-title { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 500; margin-bottom: 8px; color: var(--text); }
  .feature-desc { font-size: 13px; color: var(--muted); line-height: 1.65; }

  .section-label { font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); margin-bottom: 12px; }
  .section-title { font-family: 'Cormorant Garamond', serif; font-size: 40px; font-weight: 300; line-height: 1.15; }
  .section-title em { font-style: italic; color: var(--gold2); }

  /* ─────────────────────────────────────────────── */
  /* AUTH */
  /* ─────────────────────────────────────────────── */
  .auth-screen { flex: 1; display: flex; align-items: center; justify-content: center; padding: 24px; }
  .auth-card { width: 100%; max-width: 400px; }
  .auth-logo { text-align: center; margin-bottom: 32px; }
  .auth-logo-mark { font-family: 'Cormorant Garamond', serif; font-size: 32px; font-weight: 300; letter-spacing: 0.15em; color: var(--gold2); }
  .auth-title { font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 400; text-align: center; margin-bottom: 6px; }
  .auth-sub { text-align: center; color: var(--muted); font-size: 13px; margin-bottom: 28px; }
  .form-group { margin-bottom: 16px; }
  .google-btn { width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px; padding: 11px; background: var(--void); border: 1px solid var(--border2); border-radius: var(--r); color: var(--text); font-size: 14px; cursor: pointer; transition: all 0.2s; font-family: 'DM Sans', sans-serif; }
  .google-btn:hover { border-color: var(--border2); background: var(--card); }
  .auth-footer { text-align: center; margin-top: 20px; font-size: 13px; color: var(--muted); }
  .auth-footer a { color: var(--gold); cursor: pointer; }
  .trial-badge { display: inline-flex; align-items: center; gap: 6px; background: var(--gold-dim); border: 1px solid rgba(201,168,76,0.2); border-radius: 20px; padding: 4px 12px; font-size: 12px; color: var(--gold); margin: 0 auto 20px; }

  /* ─────────────────────────────────────────────── */
  /* ONBOARDING */
  /* ─────────────────────────────────────────────── */
  .onboarding { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 24px; overflow-y: auto; }
  .onboarding-inner { width: 100%; max-width: 520px; }
  .ob-progress { display: flex; gap: 6px; margin-bottom: 40px; }
  .ob-step { flex: 1; height: 2px; border-radius: 1px; background: var(--border); transition: background 0.4s; }
  .ob-step.done { background: var(--gold); }
  .ob-step.active { background: linear-gradient(90deg, var(--gold), var(--gold2)); }
  .ob-eyebrow { font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--gold); margin-bottom: 10px; }
  .ob-title { font-family: 'Cormorant Garamond', serif; font-size: 34px; font-weight: 300; line-height: 1.2; margin-bottom: 8px; }
  .ob-title em { font-style: italic; color: var(--gold2); }
  .ob-sub { color: var(--muted); font-size: 14px; line-height: 1.6; margin-bottom: 32px; }
  .ob-fields { display: flex; flex-direction: column; gap: 14px; margin-bottom: 28px; }
  .ob-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

  /* Context intake */
  .choice-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 28px; }
  .choice-card { padding: 16px; border: 1px solid var(--border); border-radius: var(--r); cursor: pointer; transition: all 0.2s; background: var(--void); text-align: center; }
  .choice-card:hover { border-color: rgba(201,168,76,0.3); }
  .choice-card.selected { border-color: var(--gold); background: var(--gold-dim); }
  .choice-icon { font-size: 22px; margin-bottom: 6px; }
  .choice-label { font-size: 13px; color: var(--text); }

  /* First message preview */
  .first-msg-wrap { background: var(--void); border: 1px solid var(--border); border-radius: var(--r2); padding: 20px; margin-bottom: 28px; }
  .first-msg-header { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
  .astral-avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, var(--accent), var(--gold)); display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
  .first-msg-name { font-size: 13px; font-weight: 500; color: var(--gold); }
  .first-msg-time { font-size: 11px; color: var(--muted2); }
  .first-msg-text { font-size: 14px; line-height: 1.7; color: var(--text); font-style: italic; }
  .typing-dots { display: inline-flex; gap: 4px; align-items: center; padding: 4px 0; }
  .typing-dots span { width: 5px; height: 5px; border-radius: 50%; background: var(--muted); animation: blink 1.2s infinite; }
  .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
  .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes blink { 0%,80%,100% { opacity:0.2 } 40% { opacity:1 } }

  /* ─────────────────────────────────────────────── */
  /* CHAT */
  /* ─────────────────────────────────────────────── */
  .chat-layout { flex: 1; display: flex; overflow: hidden; }
  .chat-sidebar { width: 240px; flex-shrink: 0; border-right: 1px solid var(--border); display: flex; flex-direction: column; background: rgba(13,15,26,0.8); }
  .sidebar-top { padding: 16px; border-bottom: 1px solid var(--border); }
  .sidebar-section { padding: 8px 12px 4px; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted2); margin-top: 4px; }
  .sidebar-item { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 7px; cursor: pointer; font-size: 13px; color: var(--muted); transition: all 0.15s; margin: 1px 4px; }
  .sidebar-item:hover { background: var(--void); color: var(--text); }
  .sidebar-item.active { background: var(--card); color: var(--text); }
  .sidebar-item-icon { font-size: 15px; flex-shrink: 0; opacity: 0.8; }
  .sidebar-item-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
  .sidebar-item-badge { font-size: 10px; background: var(--gold-dim); color: var(--gold); border-radius: 10px; padding: 1px 6px; flex-shrink: 0; }

  .chat-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
  .chat-header { padding: 14px 20px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 12px; flex-shrink: 0; background: rgba(8,9,15,0.7); backdrop-filter: blur(12px); }
  .chat-header-info { flex: 1; }
  .chat-header-title { font-size: 14px; font-weight: 500; }
  .chat-header-sub { font-size: 12px; color: var(--muted); }
  .chat-header-actions { display: flex; gap: 4px; }

  /* Transit card */
  .transit-card { margin: 16px 20px 0; background: linear-gradient(135deg, rgba(201,168,76,0.06), rgba(123,111,160,0.08)); border: 1px solid rgba(201,168,76,0.15); border-radius: var(--r); padding: 12px 16px; display: flex; align-items: flex-start; gap: 12px; }
  .transit-card-icon { font-size: 18px; flex-shrink: 0; margin-top: 1px; }
  .transit-card-content { flex: 1; }
  .transit-card-label { font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--gold); margin-bottom: 4px; }
  .transit-card-text { font-size: 13px; color: var(--text); line-height: 1.5; }
  .transit-card-close { color: var(--muted2); cursor: pointer; font-size: 16px; flex-shrink: 0; line-height: 1; }

  .messages-area { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 20px; }
  .msg-row { display: flex; gap: 10px; align-items: flex-end; }
  .msg-row.user { flex-direction: row-reverse; }
  .msg-avatar { width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0; }
  .msg-avatar.astral { background: linear-gradient(135deg, var(--accent), var(--gold)); display: flex; align-items: center; justify-content: center; font-size: 12px; }
  .msg-avatar.user { background: linear-gradient(135deg, #3a3a5c, var(--accent)); display: flex; align-items: center; justify-content: center; font-size: 11px; }
  .msg-bubble { max-width: 68%; padding: 12px 16px; border-radius: 16px; font-size: 14px; line-height: 1.65; }
  .msg-bubble.astral { background: var(--card); border: 1px solid var(--border); border-bottom-left-radius: 4px; color: var(--text); }
  .msg-bubble.user { background: linear-gradient(135deg, #2a2550, #1e1d3a); border: 1px solid rgba(123,111,160,0.2); border-bottom-right-radius: 4px; color: var(--text); }
  .msg-meta { font-size: 11px; color: var(--muted2); margin-top: 4px; text-align: right; }
  .msg-meta.astral { text-align: left; }
  .msg-astro-tag { display: inline-flex; align-items: center; gap: 4px; background: var(--gold-dim); border-radius: 10px; padding: 2px 8px; font-size: 11px; color: var(--gold); margin-top: 8px; }

  .suggested-prompts { padding: 12px 20px; border-top: 1px solid var(--border); display: flex; gap: 8px; overflow-x: auto; flex-shrink: 0; }
  .suggested-prompts::-webkit-scrollbar { display: none; }
  .prompt-chip { flex-shrink: 0; padding: 7px 14px; background: var(--void); border: 1px solid var(--border); border-radius: 20px; font-size: 12px; color: var(--muted); cursor: pointer; transition: all 0.15s; white-space: nowrap; }
  .prompt-chip:hover { border-color: rgba(201,168,76,0.3); color: var(--text); }

  .chat-input-area { padding: 12px 20px 16px; border-top: 1px solid var(--border); flex-shrink: 0; }
  .chat-input-wrap { display: flex; gap: 10px; align-items: flex-end; background: var(--void); border: 1px solid var(--border); border-radius: 14px; padding: 10px 14px; transition: border-color 0.2s; }
  .chat-input-wrap:focus-within { border-color: rgba(201,168,76,0.3); }
  .chat-textarea { flex: 1; background: none; border: none; outline: none; color: var(--text); font-family: 'DM Sans', sans-serif; font-size: 14px; resize: none; line-height: 1.5; max-height: 120px; min-height: 22px; }
  .chat-textarea::placeholder { color: var(--muted2); }
  .send-btn { width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, var(--gold), var(--gold2)); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.2s; color: #0d0f1a; font-size: 15px; }
  .send-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(201,168,76,0.3); }

  /* ─────────────────────────────────────────────── */
  /* DAILY BRIEFING */
  /* ─────────────────────────────────────────────── */
  .briefing-screen { flex: 1; overflow-y: auto; padding: 32px 24px; }
  .briefing-inner { max-width: 640px; margin: 0 auto; }
  .briefing-date { font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--gold); margin-bottom: 8px; }
  .briefing-title { font-family: 'Cormorant Garamond', serif; font-size: 36px; font-weight: 300; line-height: 1.2; margin-bottom: 6px; }
  .briefing-subtitle { color: var(--muted); font-size: 14px; margin-bottom: 32px; }
  .briefing-content { font-size: 15px; line-height: 1.85; color: var(--text); margin-bottom: 28px; padding: 24px; background: var(--card); border: 1px solid var(--border); border-radius: var(--r2); position: relative; }
  .briefing-content::before { content:'"'; font-family: 'Cormorant Garamond', serif; font-size: 80px; color: var(--gold-dim); position: absolute; top: -8px; left: 16px; line-height: 1; }
  .briefing-content p { margin-bottom: 12px; }
  .briefing-content p:last-child { margin-bottom: 0; }
  .transit-pills { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 28px; }
  .transit-pill { display: flex; align-items: center; gap: 6px; padding: 6px 12px; background: var(--void); border: 1px solid var(--border); border-radius: 20px; font-size: 12px; color: var(--muted); }
  .transit-pill-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--gold); flex-shrink: 0; }
  .briefing-cta { display: flex; gap: 10px; }

  /* ─────────────────────────────────────────────── */
  /* RELATIONSHIPS */
  /* ─────────────────────────────────────────────── */
  .rel-screen { flex: 1; overflow-y: auto; padding: 32px 24px; }
  .rel-inner { max-width: 640px; margin: 0 auto; }
  .rel-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 28px; }
  .rel-cards { display: flex; flex-direction: column; gap: 14px; margin-bottom: 24px; }
  .rel-card { padding: 18px 20px; border: 1px solid var(--border); border-radius: var(--r2); background: var(--card); cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 16px; }
  .rel-card:hover { border-color: rgba(201,168,76,0.2); transform: translateX(4px); }
  .rel-card-avatar { width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, #3a3a5c, var(--accent)); display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
  .rel-card-info { flex: 1; }
  .rel-card-name { font-size: 15px; font-weight: 500; margin-bottom: 3px; }
  .rel-card-sub { font-size: 12px; color: var(--muted); }
  .compat-bar { height: 3px; border-radius: 2px; background: var(--border); margin-top: 8px; overflow: hidden; }
  .compat-fill { height: 100%; border-radius: 2px; background: linear-gradient(90deg, var(--gold), var(--gold2)); transition: width 0.6s cubic-bezier(.22,1,.36,1); }
  .rel-add-card { padding: 18px 20px; border: 1px dashed var(--border2); border-radius: var(--r2); cursor: pointer; display: flex; align-items: center; gap: 14px; color: var(--muted); transition: all 0.2s; }
  .rel-add-card:hover { border-color: var(--gold); color: var(--gold); }

  /* Relationship detail */
  .rel-detail { padding: 28px 20px; }
  .rel-detail-header { display: flex; align-items: center; gap: 16px; margin-bottom: 28px; }
  .rel-synastry { margin-bottom: 24px; }
  .synastry-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--border); font-size: 13px; }
  .synastry-aspect { flex: 1; color: var(--muted); }
  .synastry-type { padding: 2px 10px; border-radius: 10px; font-size: 11px; }
  .synastry-type.trine { background: rgba(100,180,100,0.12); color: #7cc87c; }
  .synastry-type.square { background: rgba(220,100,80,0.12); color: #e07a6a; }
  .synastry-type.conj { background: rgba(201,168,76,0.12); color: var(--gold); }
  .synastry-type.opp { background: rgba(160,130,200,0.12); color: #b09ad0; }

  /* ─────────────────────────────────────────────── */
  /* PAYWALL */
  /* ─────────────────────────────────────────────── */
  .paywall-overlay { position: fixed; inset: 0; background: rgba(8,9,15,0.92); backdrop-filter: blur(12px); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 24px; animation: fadeUp 0.3s ease both; }
  .paywall-card { width: 100%; max-width: 440px; background: var(--card); border: 1px solid var(--border2); border-radius: 20px; padding: 32px; text-align: center; position: relative; overflow: hidden; }
  .paywall-card::before { content:''; position:absolute; top:0; left:0; right:0; height:1px; background: linear-gradient(90deg, transparent, var(--gold), transparent); }
  .paywall-glow { position: absolute; top: -60px; left: 50%; transform: translateX(-50%); width: 200px; height: 200px; background: radial-gradient(circle, rgba(201,168,76,0.08), transparent); pointer-events: none; }
  .paywall-icon { font-size: 40px; margin-bottom: 16px; }
  .paywall-title { font-family: 'Cormorant Garamond', serif; font-size: 30px; font-weight: 400; margin-bottom: 8px; }
  .paywall-sub { color: var(--muted); font-size: 14px; line-height: 1.6; margin-bottom: 28px; }
  .plans { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
  .plan { padding: 16px; border: 1px solid var(--border); border-radius: var(--r); cursor: pointer; transition: all 0.2s; position: relative; }
  .plan.featured { border-color: var(--gold); background: var(--gold-dim); }
  .plan-badge { position: absolute; top: -9px; left: 50%; transform: translateX(-50%); background: var(--gold); color: #0d0f1a; font-size: 10px; font-weight: 600; padding: 2px 10px; border-radius: 10px; white-space: nowrap; letter-spacing: 0.05em; }
  .plan-price { font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 400; color: var(--text); }
  .plan-price span { font-size: 14px; color: var(--muted); font-family: 'DM Sans', sans-serif; }
  .plan-label { font-size: 12px; color: var(--muted); margin-top: 2px; }
  .paywall-features { display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; text-align: left; }
  .paywall-feature { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--muted); }
  .paywall-feature-check { color: var(--gold); flex-shrink: 0; }

  /* ─────────────────────────────────────────────── */
  /* SETTINGS */
  /* ─────────────────────────────────────────────── */
  .settings-screen { flex: 1; overflow-y: auto; padding: 32px 24px; }
  .settings-inner { max-width: 560px; margin: 0 auto; }
  .settings-title { font-family: 'Cormorant Garamond', serif; font-size: 32px; font-weight: 300; margin-bottom: 28px; }
  .settings-section { margin-bottom: 28px; }
  .settings-section-title { font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--gold); margin-bottom: 12px; }
  .settings-row { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; background: var(--card); border: 1px solid var(--border); border-radius: var(--r); margin-bottom: 2px; }
  .settings-row:first-of-type { border-radius: var(--r) var(--r) 2px 2px; }
  .settings-row:last-of-type { border-radius: 2px 2px var(--r) var(--r); margin-bottom: 0; }
  .settings-row-label { font-size: 14px; }
  .settings-row-sub { font-size: 12px; color: var(--muted); margin-top: 2px; }
  .settings-row-right { color: var(--muted); font-size: 13px; display: flex; align-items: center; gap: 8px; }
  .memory-item { padding: 12px 14px; background: var(--void); border: 1px solid var(--border); border-radius: var(--r); margin-bottom: 6px; display: flex; align-items: flex-start; gap: 12px; }
  .memory-cat { font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; padding: 2px 8px; border-radius: 10px; flex-shrink: 0; margin-top: 1px; }
  .memory-cat.life_event { background: rgba(100,160,220,0.1); color: #7ab0d8; }
  .memory-cat.relationship { background: rgba(200,120,140,0.1); color: #d88aa0; }
  .memory-cat.theme { background: rgba(123,111,160,0.1); color: #a090c8; }
  .memory-text { font-size: 13px; color: var(--muted); flex: 1; line-height: 1.5; }
  .memory-delete { color: var(--muted2); cursor: pointer; font-size: 16px; flex-shrink: 0; transition: color 0.15s; }
  .memory-delete:hover { color: #e07a6a; }

  /* Subscription status */
  .sub-card { padding: 20px; background: linear-gradient(135deg, rgba(201,168,76,0.06), rgba(123,111,160,0.06)); border: 1px solid rgba(201,168,76,0.15); border-radius: var(--r2); margin-bottom: 20px; display: flex; align-items: center; gap: 16px; }
  .sub-icon { font-size: 28px; }
  .sub-info { flex: 1; }
  .sub-name { font-size: 15px; font-weight: 500; color: var(--gold2); }
  .sub-detail { font-size: 12px; color: var(--muted); margin-top: 2px; }

  /* ─────────────────────────────────────────────── */
  /* MISC */
  /* ─────────────────────────────────────────────── */
  .badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 10px; font-size: 11px; }
  .badge-gold { background: var(--gold-dim); color: var(--gold); border: 1px solid rgba(201,168,76,0.2); }
  .badge-purple { background: rgba(123,111,160,0.1); color: var(--accent); border: 1px solid rgba(123,111,160,0.2); }

  .empty-state { text-align: center; padding: 60px 20px; color: var(--muted); }
  .empty-state-icon { font-size: 36px; margin-bottom: 12px; opacity: 0.5; }
  .empty-state-text { font-size: 14px; }

  .chip-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
  .chip { padding: 5px 12px; background: var(--void); border: 1px solid var(--border); border-radius: 20px; font-size: 12px; color: var(--muted); cursor: pointer; transition: all 0.15px; }
  .chip.selected { border-color: var(--gold); color: var(--gold); background: var(--gold-dim); }
  .chip:hover:not(.selected) { border-color: var(--border2); color: var(--text); }
`;

// ─── STAR FIELD ──────────────────────────────────────────────────────────────
function StarField() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    const stars = Array.from({ length: 120 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.2 + 0.2,
      o: Math.random() * 0.6 + 0.1,
      speed: Math.random() * 0.3 + 0.05,
    }));
    let t = 0;
    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      t += 0.008;
      stars.forEach((s) => {
        const pulse = s.o + Math.sin(t * s.speed + s.x) * 0.15;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(232,228,218,${pulse})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animId);
    };
  }, []);
  return <canvas ref={ref} className="stars-canvas" />;
}

// ─── SCREENS ─────────────────────────────────────────────────────────────────

function Landing({ go }: { go: (s: string) => void }) {
  return (
    <div className="landing screen">
      <div className="landing-hero">
        <div className="hero-glow" />
        <div className="hero-orbit screen stagger-1">
          <div className="hero-orbit-dot" />
          <div className="hero-center">✦</div>
        </div>
        <div className="hero-eyebrow screen stagger-2">Your chart knows you</div>
        <h1 className="hero-title screen stagger-3">
          The stars,
          <br />
          <em>translated</em>
          <br />
          for you
        </h1>
        <p className="hero-sub screen stagger-4">
          An AI that knows your natal chart as deeply as you know yourself. Not
          horoscopes — genuine insight, in conversation.
        </p>
        <div className="hero-ctas screen stagger-5">
          <button className="btn btn-gold" onClick={() => go("signup")}>
            Begin your reading
          </button>
          <button className="btn btn-outline" onClick={() => go("login")}>
            Sign in
          </button>
        </div>
        <div className="hero-social-proof screen stagger-5">
          <div className="avatars-stack">
            {["🌙", "⭐", "✦", "🌟"].map((e, i) => (
              <div
                key={i}
                className="av"
                style={{
                  background: `hsl(${240 + i * 20},40%,30%)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                }}
              >
                {e}
              </div>
            ))}
          </div>
          <span>Trusted by 2,400+ seekers in early access</span>
        </div>
      </div>

      <div className="features-section">
        <div className="section-label">Why Astral</div>
        <h2 className="section-title">
          Your chart isn&apos;t a template.
          <br />
          <em>Neither are you.</em>
        </h2>
        <div className="features-grid">
          {[
            {
              icon: "🔮",
              title: "Chart-aware AI",
              desc: "Every response is grounded in your unique natal placements — not generic sun sign content.",
            },
            {
              icon: "🌊",
              title: "Live transit context",
              desc: "Today's sky mapped to your chart, every day. The AI knows what's active for you right now.",
            },
            {
              icon: "🧠",
              title: "Remembers your life",
              desc: "Tell it what you're navigating. It carries that context forward — like a friend who actually listens.",
            },
            {
              icon: "♾️",
              title: "Relationship lens",
              desc: "Add anyone. Get a deep compatibility read and an ongoing AI thread for navigating that dynamic.",
            },
            {
              icon: "✍️",
              title: "Daily briefing",
              desc: "Wake up to a personalized transit note written for your chart, not the collective.",
            },
            {
              icon: "🌑",
              title: "No woo, no fluff",
              desc: "Grounded, intelligent, occasionally witty. Astrology as a tool for self-knowledge.",
            },
          ].map((f, i) => (
            <div
              key={i}
              className="feature-card screen"
              style={{ animationDelay: `${i * 0.07}s` }}
            >
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Auth({ mode, go }: { mode: string; go: (s: string) => void }) {
  const isSignup = mode === "signup";
  return (
    <div className="auth-screen screen">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-mark">✦ ASTRAL</div>
        </div>
        {isSignup && (
          <div style={{ textAlign: "center", marginBottom: "16px" }}>
            <div className="trial-badge">✦ 3 days free · no card required</div>
          </div>
        )}
        <h2 className="auth-title">
          {isSignup ? "Begin your journey" : "Welcome back"}
        </h2>
        <p className="auth-sub">
          {isSignup ? "Your chart is waiting." : "Your stars are in motion."}
        </p>

        <button className="google-btn">
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        <div className="divider-text">or</div>

        <div className="form-group">
          <label className="label">Email</label>
          <input className="input" type="email" placeholder="you@example.com" />
        </div>
        <div className="form-group">
          <label className="label">Password</label>
          <input className="input" type="password" placeholder="••••••••" />
        </div>
        {isSignup && (
          <div className="form-group">
            <label className="label">Confirm password</label>
            <input className="input" type="password" placeholder="••••••••" />
          </div>
        )}

        <button
          className="btn btn-gold btn-full"
          style={{ marginTop: "8px" }}
          onClick={() => go("onboarding")}
        >
          {isSignup ? "Create account" : "Sign in"}
        </button>

        <p className="auth-footer">
          {isSignup ? (
            <>
              Already have an account?{" "}
              <a onClick={() => go("login")}>Sign in</a>
            </>
          ) : (
            <>
              New here? <a onClick={() => go("signup")}>Create account</a>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

function Onboarding({ go }: { go: (s: string) => void }) {
  const [step, setStep] = useState(0);
  const [focus, setFocus] = useState<number | null>(null);
  const [typing, setTyping] = useState(true);

  const steps = ["Birth data", "Context", "First message"];

  useEffect(() => {
    if (step === 2) {
      const t = setTimeout(() => setTyping(false), 2200);
      return () => clearTimeout(t);
    }
  }, [step]);

  return (
    <div className="onboarding screen">
      <div className="onboarding-inner">
        <div className="ob-progress">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`ob-step ${i < step ? "done" : i === step ? "active" : ""}`}
            />
          ))}
        </div>

        {step === 0 && (
          <div className="screen">
            <div className="ob-eyebrow">Step 1 of 3</div>
            <h2 className="ob-title">
              When were you <em>born?</em>
            </h2>
            <p className="ob-sub">
              Your natal chart is calculated from the exact moment and place of
              your birth. The more precise, the more personal.
            </p>
            <div className="ob-fields">
              <div>
                <label className="label">Date of birth</label>
                <input
                  className="input"
                  type="date"
                  defaultValue="1992-11-14"
                />
              </div>
              <div className="ob-row">
                <div>
                  <label className="label">Time of birth</label>
                  <input
                    className="input"
                    type="time"
                    defaultValue="14:30"
                  />
                </div>
                <div>
                  <label className="label">Timezone</label>
                  <select className="input" style={{ cursor: "pointer" }}>
                    <option>Europe/Paris (UTC+1)</option>
                    <option>America/New_York</option>
                    <option>America/Los_Angeles</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Place of birth</label>
                <input
                  className="input"
                  type="text"
                  placeholder="e.g. Paris, France"
                  defaultValue="Paris, France"
                />
              </div>
            </div>
            <p
              style={{
                fontSize: "12px",
                color: "var(--muted2)",
                marginBottom: "24px",
              }}
            >
              Don&apos;t know your exact birth time? Use noon — the chart will
              still be meaningful.
            </p>
            <button className="btn btn-gold" onClick={() => setStep(1)}>
              Calculate my chart →
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="screen">
            <div className="ob-eyebrow">Step 2 of 3</div>
            <h2 className="ob-title">
              What are you <em>navigating?</em>
            </h2>
            <p className="ob-sub">
              This helps Astral frame your first conversation with intention.
              You can always shift focus later.
            </p>
            <div className="choice-grid">
              {[
                { icon: "💼", label: "Career & purpose" },
                { icon: "💕", label: "Love & relationships" },
                { icon: "🌱", label: "Self & growth" },
                { icon: "🌀", label: "All of the above" },
              ].map((c, i) => (
                <div
                  key={i}
                  className={`choice-card ${focus === i ? "selected" : ""}`}
                  onClick={() => setFocus(i)}
                >
                  <div className="choice-icon">{c.icon}</div>
                  <div className="choice-label">{c.label}</div>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label className="label">
                In one line — what&apos;s going on? (optional)
              </label>
              <input
                className="input"
                placeholder="e.g. figuring out whether to change careers..."
              />
            </div>
            <button className="btn btn-gold" onClick={() => setStep(2)}>
              Prepare my reading →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="screen">
            <div className="ob-eyebrow">Step 3 of 3</div>
            <h2 className="ob-title">
              <em>Astral</em> is reading your chart
            </h2>
            <p className="ob-sub">
              Your natal chart has been computed. Here&apos;s your opening
              message.
            </p>
            <div className="first-msg-wrap">
              <div className="first-msg-header">
                <div className="astral-avatar">✦</div>
                <div>
                  <div className="first-msg-name">Astral</div>
                  <div className="first-msg-time">Just now</div>
                </div>
              </div>
              {typing ? (
                <div className="typing-dots">
                  <span />
                  <span />
                  <span />
                </div>
              ) : (
                <div className="first-msg-text">
                  &ldquo;With your Sun in Scorpio in the third house, you&apos;ve
                  always understood that words are power — and this is a time to
                  use them. Mercury is currently conjunct your natal Sun within a
                  degree, which is rare and brief. This is not a week to stay
                  quiet about what you want.&rdquo;
                </div>
              )}
            </div>
            {!typing && (
              <button className="btn btn-gold" onClick={() => go("chat")}>
                Open my reading →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const MESSAGES = [
  {
    id: 1,
    role: "assistant",
    text: "With your Sun in Scorpio in the third house, you've always understood that words are power — and this is a time to use them. Mercury is currently conjunct your natal Sun within a degree. This is not a week to stay quiet about what you want.",
    tag: "☿ Mercury conj. Sun",
  },
  {
    id: 2,
    role: "user",
    text: "What does that actually mean for my job situation?",
  },
  {
    id: 3,
    role: "assistant",
    text: "Saturn is still transiting your 10th house — the house of career, authority, public life. It's been there since early last year and will stay through 2026. Saturn transits here are slow, grinding, and often feel like a wall. But they're also where the most durable foundations get built. The Mercury activation today suggests a window: a conversation, a pitch, a message sent. Small moves under Saturn build structure. What's the specific thing you've been holding back from saying?",
  },
  {
    id: 4,
    role: "user",
    text: "I've been thinking about asking for a significant raise. I keep second-guessing myself.",
  },
  {
    id: 5,
    role: "assistant",
    text: "That hesitation makes complete sense with your chart. Venus square Saturn natally — you often feel you have to earn the right to ask for what you're worth, twice over. But here's the thing: Mercury exact on your Sun today is peak articulation energy for you personally. If you're going to have that conversation, this week is genuinely better than most. Not because the stars guarantee yes — but because your own ability to express your value is heightened right now. What's making you second-guess it most?",
    tag: "♀ Venus sq. Saturn (natal)",
  },
];

function Chat({ go }: { go: (s: string) => void }) {
  const [showTransit, setShowTransit] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const [input, setInput] = useState("");
  const [activeConv, setActiveConv] = useState(0);
  const messagesRef = useRef<HTMLDivElement>(null);

  const conversations = [
    { title: "Career & the raise", time: "Now" },
    { title: "Relationship with Sam", time: "Yesterday" },
    { title: "The move question", time: "Mon" },
  ];

  const chips = [
    "What's the most important transit this month?",
    "How does my chart handle conflict?",
    "What does my Venus placement say about love?",
    "Best timing for a big decision?",
  ];

  return (
    <div className="chat-layout screen">
      {showPaywall && <Paywall onClose={() => setShowPaywall(false)} />}

      {/* Sidebar */}
      <div className="chat-sidebar">
        <div className="sidebar-top">
          <button className="btn btn-outline btn-sm btn-full" onClick={() => {}}>
            + New conversation
          </button>
        </div>
        <div className="sidebar-section">Today&apos;s sky</div>
        <div
          className="sidebar-item active"
          onClick={() => go("briefing")}
        >
          <span className="sidebar-item-icon">🌙</span>
          <span className="sidebar-item-text">Daily briefing</span>
          <span className="sidebar-item-badge">New</span>
        </div>
        <div className="sidebar-section">Conversations</div>
        {conversations.map((c, i) => (
          <div
            key={i}
            className={`sidebar-item ${activeConv === i ? "active" : ""}`}
            onClick={() => setActiveConv(i)}
          >
            <span className="sidebar-item-icon">💬</span>
            <span className="sidebar-item-text">{c.title}</span>
          </div>
        ))}
        <div className="sidebar-section">People</div>
        <div className="sidebar-item" onClick={() => go("relationships")}>
          <span className="sidebar-item-icon">💕</span>
          <span className="sidebar-item-text">Relationships</span>
        </div>
        <div style={{ flex: 1 }} />
        <div className="sidebar-item" onClick={() => go("settings")}>
          <span className="sidebar-item-icon">⚙️</span>
          <span className="sidebar-item-text">Settings</span>
        </div>
      </div>

      {/* Main */}
      <div className="chat-main">
        <div className="chat-header">
          <div className="chat-header-info">
            <div className="chat-header-title">Career & the raise</div>
            <div className="chat-header-sub">
              Saturn in 10th · Mercury conj. Sun active
            </div>
          </div>
          <div className="chat-header-actions">
            <div className="badge badge-gold">Trial: 2 days left</div>
          </div>
        </div>

        {showTransit && (
          <div className="transit-card">
            <div className="transit-card-icon">☿</div>
            <div className="transit-card-content">
              <div className="transit-card-label">
                Active transit · exact today
              </div>
              <div className="transit-card-text">
                Mercury is conjunct your natal Sun — peak clarity for
                self-expression. A conversation started today carries unusual
                weight.
              </div>
            </div>
            <div
              className="transit-card-close"
              onClick={() => setShowTransit(false)}
            >
              ×
            </div>
          </div>
        )}

        <div className="messages-area" ref={messagesRef}>
          {MESSAGES.map((m) => (
            <div key={m.id} className={`msg-row ${m.role}`}>
              <div className={`msg-avatar ${m.role}`}>
                {m.role === "assistant" ? "✦" : "J"}
              </div>
              <div>
                <div className={`msg-bubble ${m.role}`}>
                  {m.text}
                  {m.tag && (
                    <div className="msg-astro-tag">✦ {m.tag}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="suggested-prompts">
          {chips.map((c, i) => (
            <div
              key={i}
              className="prompt-chip"
              onClick={() => setInput(c)}
            >
              {c}
            </div>
          ))}
        </div>

        <div className="chat-input-area">
          <div className="chat-input-wrap">
            <textarea
              className="chat-textarea"
              rows={1}
              placeholder="Ask anything about your chart..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              className="send-btn"
              onClick={() => {
                setInput("");
                setShowPaywall(true);
              }}
            >
              ➤
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Briefing({ go }: { go: (s: string) => void }) {
  return (
    <div className="briefing-screen screen">
      <div className="briefing-inner">
        <button
          className="btn btn-ghost"
          style={{ marginBottom: "16px", paddingLeft: 0 }}
          onClick={() => go("chat")}
        >
          ← Back
        </button>
        <div className="briefing-date">Thursday, May 21 · Daily briefing</div>
        <h1 className="briefing-title">
          A window for
          <br />
          honest words
        </h1>
        <p className="briefing-subtitle">
          Your chart for today, written personally.
        </p>

        <div className="briefing-content">
          <p>
            Mercury sits within 0.8° of your natal Sun today — the closest it
            will be all year. For you, with Sun in Scorpio in the third house,
            this is not a generic Mercury day. Communication is already your
            native currency; today the exchange rate is especially favorable.
          </p>
          <p>
            Saturn continues its slow grind through your 10th house. You&apos;re
            in the middle of a multi-year chapter that&apos;s asking you to build
            something that lasts in your professional life. The temptation is to
            wait until things feel more certain. Saturn rarely rewards waiting.
          </p>
          <p>
            The Moon moves into Taurus this afternoon, activating your 7th house
            of partnership. A good evening for a real conversation with someone
            who matters.
          </p>
        </div>

        <div className="transit-pills">
          {[
            "☿ Mercury conj. Sun (0.8°)",
            "♄ Saturn in 10th (ongoing)",
            "🌙 Moon → Taurus 4:22pm",
          ].map((t, i) => (
            <div key={i} className="transit-pill">
              <div className="transit-pill-dot" />
              {t}
            </div>
          ))}
        </div>

        <div className="briefing-cta">
          <button className="btn btn-gold" onClick={() => go("chat")}>
            Explore in chat
          </button>
          <button className="btn btn-outline">Share briefing</button>
        </div>
      </div>
    </div>
  );
}

function Relationships({ go }: { go: (s: string) => void }) {
  const [detail, setDetail] = useState<number | null>(null);
  const people = [
    {
      name: "Sam",
      sign: "Taurus ☉ · Libra ↑",
      compat: 78,
      emoji: "🌙",
      desc: "Romantic partner",
    },
    {
      name: "Claire",
      sign: "Gemini ☉ · Scorpio ↑",
      compat: 62,
      emoji: "⭐",
      desc: "Close friend",
    },
  ];

  if (detail !== null) {
    const p = people[detail];
    return (
      <div className="rel-screen screen">
        <div className="rel-inner rel-detail">
          <button
            className="btn btn-ghost"
            style={{ paddingLeft: 0, marginBottom: "20px" }}
            onClick={() => setDetail(null)}
          >
            ← Back
          </button>
          <div className="rel-detail-header">
            <div className="rel-card-avatar" style={{ fontSize: "24px" }}>
              {p.emoji}
            </div>
            <div>
              <div
                style={{
                  fontSize: "20px",
                  fontFamily: "'Cormorant Garamond', serif",
                  fontWeight: 400,
                }}
              >
                {p.name}
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: "var(--muted)",
                  marginTop: "2px",
                }}
              >
                {p.sign}
              </div>
            </div>
            <div
              className="badge badge-gold"
              style={{ marginLeft: "auto" }}
            >
              {p.compat}% resonance
            </div>
          </div>

          <div className="card" style={{ marginBottom: "16px" }}>
            <div
              style={{
                fontSize: "13px",
                color: "var(--muted)",
                lineHeight: 1.7,
              }}
            >
              Your Scorpio Sun and {p.name}&apos;s {p.sign.split(" ")[0]} Sun
              create a dynamic of deep intensity meeting earthy steadiness.
              Their Venus falls conjunct your natal Moon — they instinctively
              nurture what you need emotionally, even when you don&apos;t voice
              it. Watch for power dynamics when your Mars squares their Saturn.
            </div>
          </div>

          <div
            style={{
              fontSize: "11px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--gold)",
              marginBottom: "12px",
            }}
          >
            Key synastry aspects
          </div>
          <div className="rel-synastry">
            {[
              {
                aspect: "Their Venus conj. your Moon",
                type: "conj",
                label: "Conjunction",
              },
              {
                aspect: "Your Sun trine their Jupiter",
                type: "trine",
                label: "Trine",
              },
              {
                aspect: "Your Mars sq. their Saturn",
                type: "square",
                label: "Square",
              },
              {
                aspect: "Their Moon opp. your Pluto",
                type: "opp",
                label: "Opposition",
              },
              {
                aspect: "Your Mercury trine their Sun",
                type: "trine",
                label: "Trine",
              },
            ].map((r, i) => (
              <div key={i} className="synastry-row">
                <span className="synastry-aspect">{r.aspect}</span>
                <span className={`synastry-type ${r.type}`}>{r.label}</span>
              </div>
            ))}
          </div>

          <button
            className="btn btn-gold"
            style={{ marginTop: "20px" }}
            onClick={() => go("chat")}
          >
            Ask Astral about {p.name}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rel-screen screen">
      <div className="rel-inner">
        <button
          className="btn btn-ghost"
          style={{ paddingLeft: 0, marginBottom: "8px" }}
          onClick={() => go("chat")}
        >
          ← Back
        </button>
        <div className="rel-header">
          <div>
            <div className="section-label">Relationships</div>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "32px",
                fontWeight: 300,
              }}
            >
              Your people
            </h2>
          </div>
        </div>

        <div className="rel-cards">
          {people.map((p, i) => (
            <div key={i} className="rel-card" onClick={() => setDetail(i)}>
              <div className="rel-card-avatar">{p.emoji}</div>
              <div className="rel-card-info">
                <div className="rel-card-name">{p.name}</div>
                <div className="rel-card-sub">
                  {p.desc} · {p.sign}
                </div>
                <div className="compat-bar">
                  <div
                    className="compat-fill"
                    style={{ width: `${p.compat}%` }}
                  />
                </div>
              </div>
              <div style={{ fontSize: "13px", color: "var(--gold)" }}>
                {p.compat}%
              </div>
            </div>
          ))}
        </div>

        <div className="rel-add-card" onClick={() => {}}>
          <div style={{ fontSize: "22px" }}>+</div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 500 }}>
              Add a person
            </div>
            <div style={{ fontSize: "12px", marginTop: "2px" }}>
              Birth data needed for full compatibility
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: "20px",
            padding: "14px 16px",
            background: "var(--void)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r)",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <span>🔒</span>
          <div style={{ fontSize: "13px", color: "var(--muted)" }}>
            Free plan includes 1 relationship profile.{" "}
            <span style={{ color: "var(--gold)", cursor: "pointer" }}>
              Upgrade for unlimited.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Paywall({ onClose }: { onClose: () => void }) {
  const [plan, setPlan] = useState("annual");
  return (
    <div className="paywall-overlay" onClick={onClose}>
      <div className="paywall-card" onClick={(e) => e.stopPropagation()}>
        <div className="paywall-glow" />
        <div className="paywall-icon">✦</div>
        <h2 className="paywall-title">Your trial has ended</h2>
        <p className="paywall-sub">
          You&apos;ve used your 3 free days. Continue your reading — your chart
          context and conversation history are saved.
        </p>

        <div className="plans">
          <div
            className="plan"
            onClick={() => setPlan("monthly")}
            style={{
              cursor: "pointer",
              borderColor:
                plan === "monthly" ? "var(--border2)" : "var(--border)",
            }}
          >
            <div className="plan-price">
              €9<span>/mo</span>
            </div>
            <div className="plan-label">Monthly</div>
          </div>
          <div className="plan featured" onClick={() => setPlan("annual")}>
            <div className="plan-badge">Best value</div>
            <div className="plan-price">
              €59<span>/yr</span>
            </div>
            <div className="plan-label">Annual · €4.9/mo</div>
          </div>
        </div>

        <div className="paywall-features">
          {[
            "Unlimited AI chat with your chart",
            "Daily personalized transit briefing",
            "Up to 3 relationship profiles",
            "Full conversation history & memory",
          ].map((f, i) => (
            <div key={i} className="paywall-feature">
              <span className="paywall-feature-check">✦</span>
              <span>{f}</span>
            </div>
          ))}
        </div>

        <button
          className="btn btn-gold btn-full"
          style={{ marginBottom: "10px" }}
        >
          Start for {plan === "annual" ? "€59/year" : "€9/month"} →
        </button>
        <button
          className="btn btn-ghost btn-full"
          onClick={onClose}
          style={{ fontSize: "13px" }}
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}

function Settings({ go }: { go: (s: string) => void }) {
  const memories = [
    {
      cat: "life_event",
      text: "Started a new job in tech sales in March 2025, feels uncertain about it",
    },
    {
      cat: "relationship",
      text: "Partner named Sam, relationship described as stable but lacking spark",
    },
    {
      cat: "theme",
      text: "Pattern of self-doubt before taking action, then regret when they don't act",
    },
    {
      cat: "life_event",
      text: "Considering a city move but feels stuck by logistics",
    },
  ];

  return (
    <div className="settings-screen screen">
      <div className="settings-inner">
        <button
          className="btn btn-ghost"
          style={{ paddingLeft: 0, marginBottom: "8px" }}
          onClick={() => go("chat")}
        >
          ← Back
        </button>
        <h1 className="settings-title">Settings</h1>

        <div className="sub-card">
          <div className="sub-icon">✦</div>
          <div className="sub-info">
            <div className="sub-name">Astral Pro · Annual</div>
            <div className="sub-detail">Renews May 21, 2027 · €59/year</div>
          </div>
          <button className="btn btn-outline btn-sm">Manage</button>
        </div>

        <div className="settings-section">
          <div className="settings-section-title">Birth data</div>
          {[
            { label: "Date of birth", val: "November 14, 1992" },
            { label: "Time of birth", val: "2:30 PM" },
            { label: "Place of birth", val: "Paris, France" },
          ].map((r, i) => (
            <div key={i} className="settings-row">
              <div>
                <div className="settings-row-label">{r.label}</div>
              </div>
              <div className="settings-row-right">
                {r.val}{" "}
                <span style={{ cursor: "pointer", color: "var(--gold)" }}>
                  Edit
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="settings-section">
          <div className="settings-section-title">Account</div>
          {[
            { label: "Email", val: "julian@example.com" },
            {
              label: "Notifications",
              sub: "Daily briefing by email",
              val: "On",
            },
            { label: "Password", val: "Change" },
          ].map((r, i) => (
            <div key={i} className="settings-row">
              <div>
                <div className="settings-row-label">{r.label}</div>
                {r.sub && (
                  <div className="settings-row-sub">{r.sub}</div>
                )}
              </div>
              <div
                className="settings-row-right"
                style={{
                  color:
                    r.val === "On" ? "var(--gold)" : "var(--muted)",
                  cursor: "pointer",
                }}
              >
                {r.val}
              </div>
            </div>
          ))}
        </div>

        <div className="settings-section">
          <div
            className="settings-section-title"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>Astral&apos;s memory of you</span>
            <span
              style={{
                color: "var(--muted2)",
                fontSize: "11px",
                textTransform: "none",
                letterSpacing: "normal",
              }}
            >
              {memories.length} entries
            </span>
          </div>
          <p
            style={{
              fontSize: "13px",
              color: "var(--muted)",
              marginBottom: "14px",
              lineHeight: 1.6,
            }}
          >
            Astral builds this from your conversations. Delete anything
            you&apos;d rather it forget.
          </p>
          {memories.map((m, i) => (
            <div key={i} className="memory-item">
              <span className={`memory-cat ${m.cat}`}>
                {m.cat.replace("_", " ")}
              </span>
              <span className="memory-text">{m.text}</span>
              <span className="memory-delete">×</span>
            </div>
          ))}
        </div>

        <div className="settings-section">
          <button
            className="btn btn-outline btn-full"
            style={{
              color: "#e07a6a",
              borderColor: "rgba(224,122,106,0.3)",
            }}
          >
            Delete account
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SHELL ────────────────────────────────────────────────────────────────────
const SCREENS_WITH_NAV = ["chat", "briefing", "relationships", "settings"];
const NAV_TABS = [
  { id: "chat", label: "Chat" },
  { id: "briefing", label: "Today" },
  { id: "relationships", label: "People" },
  { id: "settings", label: "Settings" },
];

export default function AstralApp() {
  const [screen, setScreen] = useState("landing");

  const go = (s: string) => setScreen(s);
  const showNav = SCREENS_WITH_NAV.includes(screen);

  return (
    <>
      <style>{css}</style>
      <StarField />
      <div className="app">
        {showNav && (
          <nav className="nav">
            <div className="nav-logo" onClick={() => go("chat")}>
              <span>✦</span> ASTRAL
            </div>
            <div className="nav-tabs">
              {NAV_TABS.map((t) => (
                <button
                  key={t.id}
                  className={`nav-tab ${screen === t.id ? "active" : ""}`}
                  onClick={() => go(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="nav-right">
              <div className="avatar">J</div>
            </div>
          </nav>
        )}

        {screen === "landing" && <Landing go={go} />}
        {screen === "login" && <Auth mode="login" go={go} />}
        {screen === "signup" && <Auth mode="signup" go={go} />}
        {screen === "onboarding" && <Onboarding go={go} />}
        {screen === "chat" && <Chat go={go} />}
        {screen === "briefing" && <Briefing go={go} />}
        {screen === "relationships" && <Relationships go={go} />}
        {screen === "settings" && <Settings go={go} />}
      </div>
    </>
  );
}
