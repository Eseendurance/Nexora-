"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";

type Message = { role: "user" | "assistant"; content: string };

export default function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "I’m Nexora, your private AI chief of staff. Ask me to research a market, write a campaign, qualify a lead, plan social content, or build a presentation.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  async function send() {
    const message = input.trim();
    if (!message || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setLoading(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        history: messages.slice(-10),
      }),
    });

    const data = await res.json();

    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: data.reply ?? "Something went wrong." },
    ]);

    setLoading(false);
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  return (
    <div className="glass flex h-[calc(100vh-140px)] flex-col p-6">
      <div className="flex-1 space-y-5 overflow-y-auto pr-2">
        {messages.map((message, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={`max-w-[85%] rounded-2xl px-5 py-4 text-sm leading-relaxed ${
              message.role === "user"
                ? "ml-auto bg-[var(--accent)] text-white"
                : "surface"
            }`}
          >
            {message.content}
          </motion.div>
        ))}

        {loading && (
          <div className="surface max-w-[200px] px-5 py-4 text-sm text-[var(--muted)]">
            Nexora is thinking…
          </div>
        )}

        <div ref={endRef} />
      </div>

      <div className="mt-5 flex gap-3">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && send()}
          placeholder="Ask Nexora anything…"
          className="surface flex-1 px-5 py-4 text-sm outline-none"
        />
        <button
          onClick={send}
          disabled={loading}
          className="rounded-xl bg-[var(--accent)] px-6 font-semibold disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </div>
  );
}
