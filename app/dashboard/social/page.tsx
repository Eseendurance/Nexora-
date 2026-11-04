"use client";

import { useState } from "react";
import { motion } from "framer-motion";

type Platform = "linkedin" | "instagram" | "x" | "tiktok" | "youtube" | "facebook";
type SocialPlan = {
  strategy: string;
  pillars: string[];
  calendar: Array<{ day: number; format: string; hook: string; caption: string }>;
  kpis: string[];
};
const platforms: Platform[] = ["linkedin", "instagram", "x", "tiktok", "youtube", "facebook"];

export default function SocialManager() {
  const [form, setForm] = useState<{
    goal: string;
    platform: Platform;
    audience: string;
    tone: string;
    days: number;
  }>({
    goal: "Grow qualified inbound leads",
    platform: "linkedin",
    audience: "founders and marketing leaders",
    tone: "premium, insightful, confident",
    days: 7,
  });
  const [plan, setPlan] = useState<SocialPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unable to generate a social plan.");
      setPlan(data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to generate a social plan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="display text-3xl font-bold">Social Media Manager</h1>

      <div className="glass mt-8 grid gap-4 p-6 md:grid-cols-2">
        <input className="surface px-4 py-3" value={form.goal}
          onChange={(e) => setForm({ ...form, goal: e.target.value })} />
        <select className="surface px-4 py-3" value={form.platform}
          onChange={(e) => {
            const platform = platforms.find((value) => value === e.target.value);
            if (platform) setForm({ ...form, platform });
          }}>
          {platforms.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <input className="surface px-4 py-3" value={form.audience}
          onChange={(e) => setForm({ ...form, audience: e.target.value })} />
        <input className="surface px-4 py-3" value={form.tone}
          onChange={(e) => setForm({ ...form, tone: e.target.value })} />
      </div>

      <button onClick={generate} disabled={loading}
        className="mt-6 rounded-full bg-[var(--accent)] px-7 py-3 font-semibold">
        {loading ? "Building…" : "Generate Content System"}
      </button>
      {error && <p role="alert" className="mt-4 text-sm text-red-400">{error}</p>}

      {plan && (
        <section className="mt-8">
          <div className="glass mb-5 p-6">
            <h2 className="display text-xl font-bold">Strategy</h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{plan.strategy}</p>
            <p className="mt-3 text-sm"><strong>Content pillars:</strong> {plan.pillars.join(" · ")}</p>
            <p className="mt-2 text-sm"><strong>KPIs:</strong> {plan.kpis.join(" · ")}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plan.calendar.map((post, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }} className="glass p-5">
              <p className="text-xs uppercase tracking-widest text-[var(--accent)]">
                Day {post.day} · {post.format}
              </p>
              <h3 className="display mt-2 font-bold">{post.hook}</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">{post.caption}</p>
            </motion.div>
          ))}
          </div>
        </section>
      )}
    </div>
  );
}
