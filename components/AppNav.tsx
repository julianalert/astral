"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useDrawer } from "@/lib/useDrawer";

const TABS = [
  { id: "briefing",      label: "Today",      href: "/briefing" },
  { id: "year",          label: "Your Year",  href: "/year" },
  { id: "chat",          label: "Chat",       href: "/chat" },
  { id: "relationships", label: "Relationships", href: "/relationships" },
];

function BurgerIcon() {
  return (
    <span className="burger-icon" aria-hidden="true">
      <span /><span /><span />
    </span>
  );
}

export default function AppNav({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const initial = (userEmail[0] ?? "A").toUpperCase();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  useDrawer(menuOpen, closeMenu);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <>
      {menuOpen && (
        <div className="drawer-backdrop" onClick={closeMenu} aria-hidden="true" />
      )}
      <nav className="nav">
        <div className="nav-left">
          <button
            type="button"
            className="nav-burger"
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            <BurgerIcon />
          </button>
          <Link href="/briefing" className="nav-logo">
            <span>✦</span> SERAPHOVA
          </Link>
        </div>
        <div className="nav-tabs">
          {TABS.map((t) => (
            <Link
              key={t.id}
              href={t.href}
              className={`nav-tab ${pathname.startsWith(t.href) ? "active" : ""}`}
            >
              {t.label}
            </Link>
          ))}
        </div>
        <div className="nav-right">
          <div ref={dropdownRef} style={{ position: "relative" }}>
            <div className="avatar" onClick={() => setOpen(o => !o)}>{initial}</div>
            {open && (
              <div style={{
                position: "absolute", top: "calc(100% + 8px)", right: 0,
                background: "var(--card)", border: "1px solid var(--border2)",
                borderRadius: "var(--r)", minWidth: "160px", overflow: "hidden",
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)", zIndex: 200,
              }}>
                <div style={{ padding: "8px 0" }}>
                  <Link
                    href="/settings"
                    onClick={() => setOpen(false)}
                    style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      padding: "10px 16px", fontSize: "13px", color: "var(--text)",
                      cursor: "pointer", transition: "background 0.15s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--void)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <span>⚙️</span> Profile
                  </Link>
                  <div style={{ height: "1px", background: "var(--border)", margin: "4px 0" }} />
                  <button
                    onClick={signOut}
                    style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      padding: "10px 16px", fontSize: "13px", color: "var(--muted)",
                      cursor: "pointer", background: "none", border: "none",
                      width: "100%", textAlign: "left", transition: "all 0.15s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "var(--void)"; e.currentTarget.style.color = "var(--text)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--muted)"; }}
                  >
                    <span>→</span> Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className={`nav-drawer drawer ${menuOpen ? "open" : ""}`} aria-hidden={!menuOpen}>
        <div className="nav-drawer-header">
          <div className="nav-drawer-logo"><span>✦</span> SERAPHOVA</div>
        </div>
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={t.href}
            className={`nav-drawer-item ${pathname.startsWith(t.href) ? "active" : ""}`}
            onClick={closeMenu}
          >
            {t.label}
          </Link>
        ))}
        <div className="nav-drawer-divider" />
        <Link href="/settings" className="nav-drawer-item" onClick={closeMenu}>
          ⚙️ Profile
        </Link>
        <button type="button" className="nav-drawer-item" onClick={() => { closeMenu(); signOut(); }}>
          → Sign out
        </button>
      </div>
    </>
  );
}
