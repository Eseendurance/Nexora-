"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";

type SessionInfo = {
  user: {
    name: string | null;
    email: string;
    role: string;
    workspace: { name: string };
  };
};

const nav = [
  { href: "/dashboard", label: "Command Center", icon: "◈" },
  { href: "/dashboard/chat", label: "AI Chat", icon: "✦" },
  { href: "/dashboard/content", label: "Content Studio", icon: "✎" },
  { href: "/dashboard/social", label: "Social Manager", icon: "◎" },
  { href: "/dashboard/bizdev", label: "Business Development", icon: "◆" },
  { href: "/dashboard/marketing", label: "Marketing Autopilot", icon: "▲" },
  { href: "/dashboard/video", label: "Video & Presentations", icon: "▶" },
  { href: "/dashboard/inbox", label: "Inbox", icon: "✉" },
  { href: "/dashboard/brand", label: "Brand Brain", icon: "⬢" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<SessionInfo["user"] | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session")
      .then(async (response) => {
        if (!response.ok) return;
        const data = await response.json() as SessionInfo;
        if (active) setSession(data.user);
      })
      .catch((error: unknown) => console.error("Could not load workspace details.", error));
    return () => { active = false; };
  }, []);

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Could not sign out.", error);
    }
  }

  return (
    <>
    <aside className="sticky top-0 hidden h-screen w-[280px] shrink-0 flex-col border-r border-[var(--border)] p-5 lg:flex">
      <Link href="/" className="display mb-8 text-2xl font-extrabold">
        Nexora<span className="text-[var(--accent)]">AI</span>
      </Link>
      {session && (
        <div className="surface mb-5 px-4 py-3">
          <p className="truncate text-sm font-semibold">{session.workspace.name}</p>
          <p className="mt-1 truncate text-xs text-[var(--muted)]">{session.name ?? session.email} · {session.role}</p>
        </div>
      )}

      <nav className="flex flex-1 flex-col gap-1">
        {nav.map((item) => {
          const active = pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${
                active ? "text-[var(--text)]" : "text-[var(--muted)]"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl bg-[var(--accent-soft)]"
                />
              )}
              <span className="relative">{item.icon}</span>
              <span className="relative">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 flex items-center justify-between">
        <span className="text-xs text-[var(--muted)]">Appearance</span>
        <ThemeToggle />
      </div>
      <button onClick={logout} className="mt-4 rounded-lg px-4 py-2 text-left text-sm text-[var(--muted)] hover:bg-[var(--surface)]">
        Sign out
      </button>
    </aside>
    <nav aria-label="Dashboard navigation" className="fixed inset-x-0 top-0 z-30 flex gap-2 overflow-x-auto border-b border-[var(--border)] bg-[var(--background)]/95 p-3 backdrop-blur lg:hidden">
      {nav.map((item) => (
        <Link key={item.href} href={item.href}
          aria-current={pathname === item.href ? "page" : undefined}
          className={`shrink-0 rounded-full px-3 py-2 text-xs ${pathname === item.href ? "bg-[var(--accent-soft)] text-[var(--text)]" : "text-[var(--muted)]"}`}>
          {item.label}
        </Link>
      ))}
    </nav>
    </>
  );
}
