"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export default function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("sending");

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setStatus(res.ok ? "sent" : "error");
  }

  return (
    <form onSubmit={submit} className="glass mx-auto max-w-2xl p-8">
      <h2 className="display text-3xl font-bold">Talk to Nexora</h2>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Submissions are stored directly in your own database and optionally emailed through your SMTP account.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {[
          ["name", "Full name"],
          ["email", "Email address"],
          ["company", "Company"],
          ["phone", "Phone"],
          ["subject", "Subject"],
        ].map(([key, label]) => (
          <input
            key={key}
            required={key === "name" || key === "email" || key === "subject"}
            className="surface w-full px-4 py-3"
            placeholder={label}
            value={(form as any)[key]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          />
        ))}
      </div>

      <textarea
        required
        rows={5}
        className="surface mt-4 w-full px-4 py-3"
        placeholder="How can Nexora help?"
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
      />

      <button
        disabled={status === "sending"}
        className="mt-6 w-full rounded-full bg-[var(--accent)] px-7 py-4 font-semibold disabled:opacity-40"
      >
        {status === "sending" ? "Sending…" : "Send Message"}
      </button>

      {status === "sent" && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-center text-sm text-emerald-500"
        >
          Message received. Nexora will follow up shortly.
        </motion.p>
      )}

      {status === "error" && (
        <p className="mt-4 text-center text-sm text-red-500">
          Something went wrong. Please try again.
        </p>
      )}
    </form>
  );
}
