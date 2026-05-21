"use client";

import { useState } from "react";

const FAQ_ITEMS = [
  {
    q: "Do I need to know anything about astrology?",
    a: "Not at all. Astral explains everything in plain language, not astrological jargon. If you want to go deeper, it can explain any placement or transit in detail — but you never have to know what a \"sextile\" is to get value from it.",
  },
  {
    q: "What if I don't know my exact birth time?",
    a: "Astral works best with an exact time, but if you don't have it, use noon as a placeholder. Your sun, moon, and most planets will still be accurate — only your rising sign and house placements require a precise time. You can always update it later if you find your birth certificate.",
  },
  {
    q: "How is this different from Co-Star or the Pattern?",
    a: "Those apps serve templated text content — the same paragraph for every Scorpio rising, forever. Astral uses AI to synthesize your chart with today's live transits and what you've personally shared about your life. Every response is generated fresh for you, not retrieved from a database of pre-written copy.",
  },
  {
    q: "What astrology system does Astral use?",
    a: "Western tropical astrology, Placidus house system. These are the most widely practiced in the West. Vedic (sidereal) astrology is on the roadmap for a future update.",
  },
  {
    q: "What happens to my birth data and conversations?",
    a: "Your data is stored securely and never sold or shared with third parties. Conversations are used only to build your memory layer — the things Astral remembers about your life to give more relevant responses. You can delete any memory or your entire account at any time from settings.",
  },
  {
    q: "Can I cancel any time?",
    a: "Yes. One click from your account settings. If you're on an annual plan and cancel in the first 14 days, you get a full refund — no questions asked.",
  },
];

export default function LandingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="faq-list">
      {FAQ_ITEMS.map((item, i) => {
        const open = openIndex === i;
        return (
          <div key={item.q} className={`faq-item${open ? " open" : ""}`}>
            <button
              type="button"
              className="faq-q"
              onClick={() => setOpenIndex(open ? null : i)}
              aria-expanded={open}
            >
              {item.q}
              <span className="faq-toggle">+</span>
            </button>
            <div className="faq-a">
              <p>{item.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
