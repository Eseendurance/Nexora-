"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export default function ContactForm() {
  const [form, setForm] = useState({
    name: "", email: "", company: "", phone: "", subject: "", message: "",
  });
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("sending");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unable to submit your message.");
      setStatus("sent");
      setForm({ name: "", email: "", company: "", phone: "", subject: "", message: "" });
    } catch (reason) {
      setStatus("error");
      setError(reason instanceof Error ? reason.message : "Unable to submit your message.");
    }
  }

  const fields: Array<[keyof typeof form, string]> = [
    ["name", "Full name"],
    ["email", "Email address"],
    ["company", "Company"],
    ["phone", "Phone"],
    ["subject", "Subject"],
  ];

  return (
    <form onSubmit={submit} className="glass mx-auto max-w-2xl p-8">
      <h2 className="display text-3xl font-bold">Talk to Nexora</h2>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {fields.map(([key, label]) => (
          <input
            key={key}
            type={key === "email" ? "email" : "text"}
            required={["name", "email", "subject"].includes(key)}
            maxLength={key === "message" ? 10000 : 254}
            className="surface w-full px-4 py-3"
            placeholder={label}
            value={form[key]}
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
        maxLength={10000}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
      />

      <button type="submit" disabled={status === "sending"} className="mt-6 w-full rounded-full bg-[var(--accent)] px-7 py-4 font-semibold disabled:opacity-50">
        {status === "sending" ? "Sending…" : "Send Message"}
      </button>

      {status === "error" && (
        <p role="alert" className="mt-4 text-center text-sm text-red-400">{error}</p>
      )}
      {status === "sent" && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-center text-emerald-500">
          Message received.
        </motion.p>
      )}
    </form>
  );
}
