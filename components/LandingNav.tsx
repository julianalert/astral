"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useDrawer } from "@/lib/useDrawer";

const LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

function BurgerIcon() {
  return (
    <span className="burger-icon" aria-hidden="true">
      <span /><span /><span />
    </span>
  );
}

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  useDrawer(menuOpen, closeMenu);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {menuOpen && (
        <div className="drawer-backdrop" onClick={closeMenu} aria-hidden="true" />
      )}
      <nav className="landing-nav" style={{ background: scrolled ? "rgba(8,9,15,0.92)" : "rgba(8,9,15,0.75)" }}>
        <Link href="/" className="landing-nav-logo">
          <span className="landing-nav-mark">✦</span> ASTRAL
        </Link>
        <div className="landing-nav-links">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href}>{l.label}</a>
          ))}
        </div>
        <div className="landing-nav-ctas">
          <button
            type="button"
            className="landing-nav-burger"
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            <BurgerIcon />
          </button>
          <Link href="/login" className="btn btn-ghost">Sign in</Link>
          <Link href="/signup" className="btn btn-gold">Start free</Link>
        </div>
      </nav>

      <div className={`nav-drawer drawer ${menuOpen ? "open" : ""}`} aria-hidden={!menuOpen}>
        <div className="nav-drawer-header">
          <div className="nav-drawer-logo"><span>✦</span> ASTRAL</div>
        </div>
        {LINKS.map((l) => (
          <a key={l.href} href={l.href} className="nav-drawer-item" onClick={closeMenu}>
            {l.label}
          </a>
        ))}
        <div className="nav-drawer-divider" />
        <Link href="/login" className="nav-drawer-item" onClick={closeMenu}>Sign in</Link>
        <Link href="/signup" className="nav-drawer-item" onClick={closeMenu}>Start free</Link>
      </div>
    </>
  );
}
