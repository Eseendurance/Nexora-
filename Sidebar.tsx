"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import ThemeToggle from "./ThemeToggle";

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

  return (
    <aside className="sticky top-0 hidden h-screen w-[280px] shrink-0 flex-col border-r border-[var(--border)] p-5 lg:flex">
      <Link href="/" className="display mb-8 text-2xl font-extrabold">
        Nexora<span className="text-[var(--accent)]">AI</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {nav.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                active ? "text-[var(--text)]" : "text-[var(--muted)] hover:text-[var(--text)]"
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
    </aside>
  );
}
