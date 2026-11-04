"use client";

import { useEffect, useState } from "react";

type BrandFields = {
  voice: string;
  audience: string;
  products: string;
  competitors: string;
  bannedWords: string;
  facts: string;
};

const fieldLabels: Array<[keyof BrandFields, string]> = [
  ["voice", "Brand voice"],
  ["audience", "Primary audience"],
  ["products", "Products and services"],
  ["competitors", "Competitors"],
  ["bannedWords", "Words to avoid"],
];

export default function BrandBrain() {
  const [brain, setBrain] = useState<BrandFields>({
    voice: "confident, clear, premium",
    audience: "business decision-makers",
    products: "", competitors: "", bannedWords: "", facts: "",
  });
  const [projectId, setProjectId] = useState("");
  const [status, setStatus] = useState("Loading your workspace brand settings…");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/brand")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Unable to load Brand Brain.");
        if (!active) return;
        setProjectId(data.projectId);
        if (data.brain) {
          setBrain({
            voice: data.brain.voice,
            audience: data.brain.audience,
            products: data.brain.products,
            competitors: data.brain.competitors,
            bannedWords: data.brain.bannedWords,
            facts: data.brain.facts,
          });
        }
        setStatus("");
      })
      .catch((error: unknown) => {
        if (active) setStatus(error instanceof Error ? error.message : "Unable to load Brand Brain.");
      });
    return () => { active = false; };
  }, []);

  async function save() {
    setSaving(true);
    setStatus("");
    try {
      const response = await fetch("/api/brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, ...brain }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to save Brand Brain.");
      setStatus("Brand Brain saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save Brand Brain.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="display text-3xl font-bold">Brand Brain</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">Workspace knowledge used to ground Nexora responses.</p>

      <div className="glass mt-8 grid gap-4 p-6 md:grid-cols-2">
        {fieldLabels.map(([key, label]) => (
          <label key={key}>
            <span className="text-sm font-medium">{label}</span>
            <input className="surface mt-2 w-full px-4 py-3"
              value={brain[key]}
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

      <button onClick={save} disabled={!projectId || saving}
        className="mt-6 rounded-full bg-[var(--accent)] px-7 py-3 font-semibold disabled:opacity-50">
        {saving ? "Saving…" : "Save Brand Brain"}
      </button>
      {status && <p role="status" className="mt-4 text-sm text-[var(--muted)]">{status}</p>}
    </div>
  );
}
