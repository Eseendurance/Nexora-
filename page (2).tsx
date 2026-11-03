"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export default function BusinessDevelopment() {
  const [form, setForm] = useState({
    company: "", website: "", offer: "",
    targetRole: "Founder or Head of Growth",
    objective: "lead_research",
  });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    const res = await fetch("/api/bizdev", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setResult(await res.json());
    setLoading(false);
  }

  return (
    <div>
      <h1 className="display text-3xl font-bold">Business Development Manager</h1>

      <div className="glass mt-8 grid gap-4 p-6 md:grid-cols-2">
        <input className="surface px-4 py-3" placeholder="Target company"
          value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
        <input className="surface px-4 py-3" placeholder="Company website"
          value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
        <input className="surface px-4 py-3" placeholder="Your offer"
          value={form.offer} onChange={(e) => setForm({ ...form, offer: e.target.value })} />
        <select className="surface px-4 py-3" value={form.objective}
          onChange={(e) => setForm({ ...form, objective: e.target.value })}>
          <option value="lead_research">Lead research</option>
          <option value="outreach">Cold outreach</option>
          <option value="proposal">Proposal</option>
          <option value="follow_up">Follow-up</option>
        </select>
      </div>

      <button onClick={run} disabled={loading}
        className="mt-6 rounded-full bg-[var(--accent)] px-7 py-3 font-semibold">
        {loading ? "Analyzing…" : "Run Nexora BD"}
      </button>

      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass mt-8 p-6">
          <h2 className="display text-2xl font-bold">Opportunity</h2>
          <p className="mt-4 text-sm text-[var(--muted)]">{result.qualification}</p>
          <div className="surface mt-5 p-5">
            <h3 className="font-semibold">Recommended outreach</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm">{result.outreachMessage}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
