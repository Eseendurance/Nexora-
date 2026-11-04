"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Message = {
  id: string;
  subject?: string;
  body: string;
  fromName?: string;
  fromEmail?: string;
  status: string;
  aiSummary?: string;
  createdAt: string;
};

export default function InboxPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [unread, setUnread] = useState(0);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Message | null>(null);

  async function load() {
    const res = await fetch(`/api/inbox?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    setMessages(data.messages ?? []);
    setUnread(data.unread ?? 0);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [query]);

  async function markRead(id: string) {
    await fetch("/api/inbox", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "read" }),
    });
    load();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <div className="glass p-5">
        <div className="flex items-center justify-between">
          <h2 className="display text-xl font-bold">Inbox</h2>
          <span className="surface px-3 py-1 text-xs">{unread} unread</span>
        </div>

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search messages…"
          className="surface mt-4 w-full px-4 py-3 text-sm outline-none"
        />

        <div className="mt-4 max-h-[640px] space-y-2 overflow-y-auto">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.button
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setSelected(message);
                  if (message.status === "unread") markRead(message.id);
                }}
                className={`w-full rounded-xl p-4 text-left transition ${
                  selected?.id === message.id
                    ? "bg-[var(--accent-soft)]"
                    : "surface hover:brightness-110"
                }`}
              >
                <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                  <span>{message.fromEmail ?? "Unknown sender"}</span>
                  {message.status === "unread" && (
                    <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
                  )}
                </div>
                <p className="mt-1 font-semibold">{message.subject ?? "No subject"}</p>
                <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">
                  {message.body}
                </p>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="glass p-6">
        {selected ? (
          <>
            <h3 className="display text-2xl font-bold">{selected.subject}</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {selected.fromName} · {selected.fromEmail}
            </p>

            {selected.aiSummary && (
              <div className="surface mt-5 p-4">
                <p className="text-xs uppercase tracking-widest text-[var(--accent)]">
                  Nexora AI Analysis
                </p>
                <p className="mt-2 text-sm">{selected.aiSummary}</p>
              </div>
            )}

            <div className="surface mt-5 whitespace-pre-wrap p-5 text-sm leading-relaxed">
              {selected.body}
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-[var(--muted)]">
            Select a message to view it.
          </div>
        )}
      </div>
    </div>
  );
}
