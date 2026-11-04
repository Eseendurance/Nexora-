import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-6">
      <header className="flex items-center justify-between py-7">
        <Link href="/" className="display text-xl font-extrabold">
          Nexora<span className="text-[var(--accent)]"> AI</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm text-[var(--muted)]">
          <Link href="/contact">Contact</Link>
          <Link href="/login">Sign in</Link>
          <Link href="/register" className="rounded-full bg-[var(--accent)] px-5 py-2.5 font-semibold text-white">
            Get started
          </Link>
        </nav>
      </header>

      <section className="flex flex-1 flex-col justify-center py-20">
        <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--cyan)]">
          Your self-hosted AI business operating system
        </p>
        <h1 className="display max-w-4xl text-5xl font-bold leading-tight md:text-7xl">
          One focused workspace for your next stage of growth.
        </h1>
        <p className="mt-7 max-w-2xl text-lg leading-relaxed text-[var(--muted)]">
          Bring research, content, business development, campaigns, and customer conversations
          together in a secure workspace powered by your own infrastructure.
        </p>
        <div className="mt-9 flex flex-wrap gap-4">
          <Link href="/register" className="rounded-full bg-[var(--accent)] px-7 py-3.5 font-semibold text-white">
            Create your workspace
          </Link>
          <Link href="/login" className="surface rounded-full px-7 py-3.5 font-semibold">
            Sign in
          </Link>
        </div>
      </section>
    </main>
  );
}
