"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export default function VideoStudio() {
  const [url, setUrl] = useState("");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [storyboard, setStoryboard] = useState<any>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  async function generateStoryboard() {
    setLoading(true);
    const res = await fetch("/api/video/script", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, prompt }),
    });
    const data = await res.json();
    setStoryboard(data.storyboard);
    setLoading(false);
  }

  async function generateVoice() {
    const narration = storyboard.slides.map((s: any) => s.narration).join(" ");
    const res = await fetch("/api/video/voice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ narration, fileName: `nexora-${Date.now()}` }),
    });
    const data = await res.json();
    setAudioUrl(data.audioUrl);
  }

  async function render() {
    const res = await fetch("/api/video/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: "demo-project",
        title: storyboard.title,
        slides: storyboard.slides,
        audioUrl,
      }),
    });
    const data = await res.json();
    setJobId(data.jobId);
  }

  return (
    <div>
      <h1 className="display text-3xl font-bold">Video & Presentation Studio</h1>
      <p className="mt-2 max-w-2xl text-[var(--muted)]">
        Turn any website into a professional presentation, narrated slide video,
        and animated company story.
      </p>

      <div className="glass mt-8 p-6">
        <input
          className="surface w-full px-4 py-3"
          placeholder="https://yourcompany.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <textarea
          className="surface mt-4 w-full px-4 py-3"
          rows={4}
          placeholder="Create a premium 60-second product presentation for founders and investors."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button
          onClick={generateStoryboard}
          disabled={loading}
          className="mt-6 rounded-full bg-[var(--accent)] px-7 py-3 font-semibold disabled:opacity-40"
        >
          {loading ? "Creating storyboard…" : "Generate Presentation"}
        </button>
      </div>

      {storyboard && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass mt-8 p-6">
          <h2 className="display text-2xl font-bold">{storyboard.title}</h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {storyboard.slides?.map((slide: any, index: number) => (
              <div key={index} className="surface p-5">
                <p className="text-xs uppercase tracking-widest text-[var(--accent)]">
                  Slide {index + 1}
                </p>
                <h3 className="display mt-2 font-bold">{slide.headline}</h3>
                <p className="mt-2 text-sm text-[var(--muted)]">{slide.narration}</p>
              </div>
            ))}
          </div>

          <div className="mt-7 flex flex-wrap gap-4">
            <button onClick={generateVoice} className="surface rounded-full px-6 py-3 font-semibold">
              Generate Voiceover
            </button>
            <button
              onClick={render}
              disabled={!audioUrl}
              className="rounded-full bg-[var(--accent)] px-6 py-3 font-semibold disabled:opacity-40"
            >
              Render Video
            </button>
          </div>

          {audioUrl && <audio controls src={audioUrl} className="mt-6 w-full" />}
          {jobId && <p className="mt-5 text-sm text-emerald-500">Render job started: {jobId}</p>}
        </motion.div>
      )}
    </div>
  );
}
