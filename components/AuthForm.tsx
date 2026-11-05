"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const registering = mode === "register";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const formData = new FormData(event.currentTarget);
    const body = Object.fromEntries(formData.entries());

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const responseBody = await response.text();
      let data: { error?: string };
      try {
        data = JSON.parse(responseBody);
      } catch {
        setError(`The server returned an unexpected response (HTTP ${response.status}). Please try again.`);
        return;
      }
      if (!response.ok) {
        setError(data.error ?? "Unable to complete sign in.");
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Could not contact the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <form onSubmit={submit} className="glass w-full max-w-md p-8">
        <Link href="/" className="display text-xl font-extrabold">
          Nexora<span className="text-[var(--accent)]"> AI</span>
        </Link>
        <h1 className="display mt-8 text-3xl font-bold">
          {registering ? "Create your workspace" : "Welcome back"}
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {registering ? "Set up your self-hosted Nexora account." : "Sign in to continue to your workspace."}
        </p>

        {registering && (
          <label className="mt-6 block text-sm font-medium">
            Your name
            <input name="name" autoComplete="name" required minLength={2} maxLength={100}
              className="surface mt-2 w-full px-4 py-3" />
          </label>
        )}
        <label className="mt-6 block text-sm font-medium">
          Email address
          <input name="email" type="email" autoComplete="email" required maxLength={254}
            className="surface mt-2 w-full px-4 py-3" />
        </label>
        <label className="mt-5 block text-sm font-medium">
          Password
          <input name="password" type="password" autoComplete={registering ? "new-password" : "current-password"}
            required minLength={registering ? 12 : 1} maxLength={128}
            className="surface mt-2 w-full px-4 py-3" />
          {registering && <span className="mt-1 block text-xs text-[var(--muted)]">Use at least 12 characters.</span>}
        </label>
        {registering && (
          <label className="mt-5 block text-sm font-medium">
            Workspace name
            <input name="workspaceName" required minLength={2} maxLength={100}
              className="surface mt-2 w-full px-4 py-3" />
          </label>
        )}

        {error && <p role="alert" className="mt-5 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
        <button disabled={busy} className="mt-7 w-full rounded-full bg-[var(--accent)] px-6 py-3.5 font-semibold text-white disabled:opacity-60">
          {busy ? "Please wait…" : registering ? "Create account" : "Sign in"}
        </button>
        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          {registering ? "Already have an account?" : "New to Nexora?"}{" "}
          <Link className="font-semibold text-[var(--text)] underline" href={registering ? "/login" : "/register"}>
            {registering ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </form>
    </main>
  );
}
