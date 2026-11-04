"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const dark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(dark ? "light" : "dark")}
      className="surface flex h-10 w-[72px] items-center px-1"
      aria-label="Toggle theme"
    >
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className={`flex h-8 w-8 items-center justify-center rounded-full ${
          dark ? "ml-auto bg-[var(--accent)] text-white" : "bg-white text-amber-500"
        }`}
      >
        {dark ? "☾" : "☀"}
      </motion.div>
    </button>
  );
}
