"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export default function SocialManager() {
  const [form, setForm] = useState({
    goal: "Grow qualified inbound leads",
    platform: "linkedin",
    audience: "founders and marketing leaders",
    tone: "premium, insightful, confident",
    days: 7,
  });
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    const res = await fetch("/api/social", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setPlan(await res.json());
    setLoading(false);
  }

  return (
    <div>
      <h1 className="display text-3xl font-bold">Social Media Manager</h1>
      <p className="mt-2 text-[var(--muted)]">
        Generate a complete platform-native content system, not just individual posts.
      </p>

      <div className="glass mt-8 grid gap-4 p-6 md:grid-cols-2">
        <input
          className="surface px-4 py-3"
          value={form.goal}
          onChange={(e) => setForm({ ...form, goal: e.target.value })}
          placeholder="Campaign goal"
        />
        <select
          className="surface px-4 py-3"
          value={form.platform}
          onChange={(e) => setForm({ ...form, platform: e.target.value })}
        >
          {["linkedin", "instagram", "x", "tiktok", "youtube", "facebook"].map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <input
          className="surface px-4 py-3"
          value={form.audience}
          onChange={(e) => setForm({ ...form, audience: e.target.value })}
          placeholder="Audience"
        />
        <input
          className="surface px-4 py-3"
          value={form.tone}
          onChange={(e) => setForm({ ...form, tone: e.target.value })}
          placeholder="Brand tone"
        />
      </div>

      <button
        onClick={generate}
        disabled={loading}
        className="mt-6 rounded-full bg-[var(--accent)] px-7 py-3 font-semibold disabled:opacity-40"
      >
        {loading ? "Building plan…" : "Generate Content System"}
      </button>

      {plan?.calendar && (
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plan.calendar.map((post: any, index: number) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass p-5"
            >
              <p className="text-xs uppercase tracking-widest text-[var(--accent)]">
                Day {post.day} · {post.format}
              </p>
              <h3 className="display mt-2 font-bold">{post.hook}</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">{post.caption}</p>
              <p className="mt-3 text-xs text-[var(--muted)]">{post.bestTime}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
