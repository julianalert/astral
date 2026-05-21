"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { id: "chat",          label: "Chat",     href: "/chat" },
  { id: "briefing",      label: "Today",    href: "/briefing" },
  { id: "relationships", label: "People",   href: "/relationships" },
  { id: "settings",      label: "Settings", href: "/settings" },
];

export default function AppNav({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const initial = (userEmail[0] ?? "A").toUpperCase();

  return (
    <nav className="nav">
      <Link href="/chat" className="nav-logo">
        <span>✦</span> ASTRAL
      </Link>
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
        <Link href="/settings" className="avatar">{initial}</Link>
      </div>
    </nav>
  );
}
