"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";

export default function ChatPanel() {
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    { role: "assistant", content: "I’m Nexora. Ask me to research, write, plan, or strategize." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  async function send() {
    const message = input.trim();
    if (!message || loading) return;

    setInput("");
    setMessages((p) => [...p, { role: "user", content: message }]);
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history: messages.slice(-10) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Nexora could not complete the request.");
      setMessages((p) => [...p, { role: "assistant", content: data.reply }]);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Nexora could not complete the request.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass flex h-[calc(100vh-140px)] flex-col p-6">
      <div className="flex-1 space-y-5 overflow-y-auto">
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={`max-w-[85%] rounded-2xl px-5 py-4 text-sm ${
              m.role === "user" ? "ml-auto bg-[var(--accent)] text-white" : "surface"
            }`}
          >
            {m.content}
          </motion.div>
        ))}
        {loading && <div className="surface max-w-[220px] px-5 py-4 text-sm">Nexora is thinking…</div>}
        <div ref={endRef} />
      </div>

      {error && <p role="alert" className="mt-3 text-sm text-red-400">{error}</p>}
      <div className="mt-5 flex gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask Nexora anything…"
          className="surface flex-1 px-5 py-4"
        />
        <button type="button" onClick={send} disabled={loading} className="rounded-xl bg-[var(--accent)] px-6 font-semibold disabled:opacity-50">
          Send
        </button>
      </div>
    </div>
  );
}
