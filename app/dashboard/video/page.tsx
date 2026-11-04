"use client";

import { useState } from "react";
import { motion } from "framer-motion";

type Slide = {
  headline: string;
  subheadline: string;
  narration: string;
  visualDirection: string;
  durationSeconds: number;
};

type Storyboard = {
  title: string;
  hook: string;
  callToAction: string;
  slides: Slide[];
};

export default function VideoStudio() {
  const [url, setUrl] = useState("");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [storyboard, setStoryboard] = useState<Storyboard | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function generateStoryboard() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/video/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unable to generate a storyboard.");
      setStoryboard(data.storyboard);
      setAudioUrl(null);
      setJobId(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to generate a storyboard.");
    } finally {
      setLoading(false);
    }
  }

  async function generateVoice() {
    if (!storyboard) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/video/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          narration: storyboard.slides.map((slide) => slide.narration).join(" "),
          fileName: `nexora-${Date.now()}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unable to generate narration.");
      setAudioUrl(data.audioUrl);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to generate narration.");
    } finally {
      setLoading(false);
    }
  }

  async function render() {
    if (!storyboard || !audioUrl) return;
    setError("");
    setLoading(true);
    try {
      const sessionResponse = await fetch("/api/auth/session");
      const sessionData = await sessionResponse.json();
      if (!sessionResponse.ok || !sessionData.projectId) {
        throw new Error("No workspace project is available for rendering.");
      }
      const res = await fetch("/api/video/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: sessionData.projectId,
          title: storyboard.title,
          slides: storyboard.slides,
          audioUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unable to start video rendering.");
      setJobId(data.jobId);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to start video rendering.");
    } finally {
      setLoading(false);
    }
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
          disabled={loading || !url || !prompt}
          className="mt-6 rounded-full bg-[var(--accent)] px-7 py-3 font-semibold disabled:opacity-40"
        >
          {loading ? "Creating storyboard…" : "Generate Presentation"}
        </button>
        {error && <p role="alert" className="mt-4 text-sm text-red-400">{error}</p>}
      </div>

      {storyboard && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass mt-8 p-6">
          <h2 className="display text-2xl font-bold">{storyboard.title}</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">{storyboard.hook}</p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {storyboard.slides.map((slide, index) => (
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
            <button disabled={loading} onClick={generateVoice} className="surface rounded-full px-6 py-3 font-semibold disabled:opacity-50">
              Generate Voiceover
            </button>
            <button
              onClick={render}
              disabled={!audioUrl || loading}
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
