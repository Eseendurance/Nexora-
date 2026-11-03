"use client";

import { useState } from "react";

export default function BrandBrain() {
  const [brain, setBrain] = useState({
    voice: "confident, clear, premium",
    audience: "founders and growth leaders",
    products: "", competitors: "", bannedWords: "", facts: "",
  });
  const [saved, setSaved] = useState(false);

  async function save() {
    await fetch("/api/brand", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: "demo-project", ...brain }),
    });
    setSaved(true);
  }

  return (
    <div>
      <h1 className="display text-3xl font-bold">Brand Brain</h1>

      <div className="glass mt-8 grid gap-4 p-6 md:grid-cols-2">
        {[
          ["voice", "Brand voice"],
          ["audience", "Primary audience"],
          ["products", "Products and services"],
          ["competitors", "Competitors"],
          ["bannedWords", "Words to avoid"],
        ].map(([key, label]) => (
          <label key={key}>
            <span className="text-sm font-medium">{label}</span>
            <input className="surface mt-2 w-full px-4 py-3"
              value={(brain as any)[key]}
              onChange={(e) => setBrain({ ...brain, [key]: e.target.value })} />
          </label>
        ))}

        <label className="md:col-span-2">
          <span className="text-sm font-medium">Approved company facts</span>
          <textarea rows={5} className="surface mt-2 w-full px-4 py-3"
            value={brain.facts}
            onChange={(e) => setBrain({ ...brain, facts: e.target.value })} />
        </label>
      </div>

      <button onClick={save} className="mt-6 rounded-full bg-[var(--accent)] px-7 py-3 font-semibold">
        {saved ? "Saved" : "Save Brand Brain"}
      </button>
    </div>
  );
}
