import Link from "next/link";

const modules = [
  ["AI Chat", "Research, strategy, analysis, and executive decision support.", "/dashboard/chat"],
  ["Content Studio", "Articles, emails, ads, landing pages, and scripts.", "/dashboard/content"],
  ["Social Manager", "Calendars, posts, hooks, hashtags, and engagement plans.", "/dashboard/social"],
  ["Business Development", "Lead research, outreach, proposals, and follow-up.", "/dashboard/bizdev"],
  ["Marketing Autopilot", "Campaign strategy, creative variants, and KPIs.", "/dashboard/marketing"],
  ["Video & Presentations", "Website-to-video, narration, slides, and avatar.", "/dashboard/video"],
  ["Inbox", "Contact submissions and AI-prioritized conversations.", "/dashboard/inbox"],
  ["Brand Brain", "Company voice, audience, products, and approved messaging.", "/dashboard/brand"],
];

export default function CommandCenter() {
  return (
    <div>
      <h1 className="display text-4xl font-extrabold">Command Center</h1>
      <p className="mt-3 max-w-2xl text-[var(--muted)]">
        Nexora unifies your company’s intelligence, communication, growth, and
        media production in one private workspace.
      </p>

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {modules.map(([title, description, href]) => (
          <Link
            key={href}
            href={href}
            className="glass p-6 transition hover:-translate-y-1 hover:brightness-110"
          >
            <h3 className="display text-xl font-bold">{title}</h3>
            <p className="mt-3 text-sm text-[var(--muted)]">{description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
