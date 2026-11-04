"use client";

import { useEffect, useState } from "react";

type ContentAsset = {
  id: string;
  kind: string;
  title: string;
  content: string;
  createdAt: string;
};

const kinds = [
  ["blog_post", "Blog article"],
  ["email", "Email"],
  ["linkedin_post", "LinkedIn post"],
  ["x_thread", "X thread"],
  ["landing_page", "Landing page"],
  ["product_description", "Product description"],
  ["ad_copy", "Ad copy"],
  ["video_script", "Video script"],
  ["proposal", "Proposal"],
];

export default function ContentStudioPage() {
  const [kind, setKind] = useState("blog_post");
  const [prompt, setPrompt] = useState("");
  const [audience, setAudience] = useState("business decision-makers");
  const [tone, setTone] = useState("clear, confident, and useful");
  const [assets, setAssets] = useState<ContentAsset[]>([]);
  const [selected, setSelected] = useState<ContentAsset | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/content")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Unable to load saved content.");
        if (active) setAssets(data.assets);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to load saved content.");
      });
    return () => { active = false; };
  }, []);

  async function generate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, prompt, audience, tone }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to generate content.");
      setAssets((current) => [data.asset, ...current]);
      setSelected(data.asset);
      setNotice(data.summary);
      setPrompt("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to generate content.");
    } finally {
      setBusy(false);
    }
  }

  async function copyContent() {
    if (!selected) return;
    try {
      await navigator.clipboard.writeText(selected.content);
      setNotice("Draft copied to clipboard.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Clipboard access failed.");
    }
  }

  return (
    <div>
      <h1 className="display text-3xl font-bold">Content Studio</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">Create and keep brand-informed drafts in your workspace.</p>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <form onSubmit={generate} className="glass space-y-4 p-6">
            <label className="block text-sm font-medium">
              Content format
              <select value={kind} onChange={(event) => setKind(event.target.value)} className="surface mt-2 w-full px-4 py-3">
                {kinds.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium">
              Brief
              <textarea required minLength={10} maxLength={5000} rows={5} value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Describe the message, offer, and desired outcome."
                className="surface mt-2 w-full px-4 py-3" />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium">
                Audience
                <input value={audience} onChange={(event) => setAudience(event.target.value)}
                  className="surface mt-2 w-full px-4 py-3" />
              </label>
              <label className="block text-sm font-medium">
                Tone
                <input value={tone} onChange={(event) => setTone(event.target.value)}
                  className="surface mt-2 w-full px-4 py-3" />
              </label>
            </div>
            <button disabled={busy} className="rounded-full bg-[var(--accent)] px-6 py-3 font-semibold text-white disabled:opacity-50">
              {busy ? "Creating draft…" : "Generate draft"}
            </button>
            {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
            {notice && <p role="status" className="text-sm text-[var(--muted)]">{notice}</p>}
          </form>

          {selected && (
            <article className="glass p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-widest text-[var(--cyan)]">{selected.kind.replaceAll("_", " ")}</p>
                  <h2 className="display mt-2 text-2xl font-bold">{selected.title}</h2>
                </div>
                <button onClick={copyContent} className="surface px-4 py-2 text-sm font-medium">Copy draft</button>
              </div>
              <div className="mt-5 whitespace-pre-wrap text-sm leading-7 text-[var(--text)]">{selected.content}</div>
            </article>
          )}
        </div>

        <aside className="glass p-5">
          <h2 className="display text-lg font-bold">Saved drafts</h2>
          <div className="mt-4 space-y-2">
            {assets.length === 0 && <p className="text-sm text-[var(--muted)]">Your generated drafts will appear here.</p>}
            {assets.map((asset) => (
              <button key={asset.id} onClick={() => setSelected(asset)}
                className={`surface w-full p-4 text-left ${selected?.id === asset.id ? "bg-[var(--accent-soft)]" : ""}`}>
                <span className="block text-xs capitalize text-[var(--muted)]">{asset.kind.replaceAll("_", " ")}</span>
                <span className="mt-1 block font-medium">{asset.title}</span>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
