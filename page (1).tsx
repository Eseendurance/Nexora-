import Link from "next/link";

const modules = [
  ["AI Chat", "Research, strategy, and executive decision support.", "/dashboard/chat"],
  ["Content Studio", "Articles, emails, ads, and landing pages.", "/dashboard/content"],
  ["Social Manager", "Calendars, posts, hooks, and engagement plans.", "/dashboard/social"],
  ["Business Development", "Leads, outreach, proposals, and follow-up.", "/dashboard/bizdev"],
  ["Marketing Autopilot", "Campaigns, creative variants, and KPIs.", "/dashboard/marketing"],
  ["Video & Presentations", "Website-to-video and narrated slides.", "/dashboard/video"],
  ["Inbox", "Contact submissions and AI-prioritized messages.", "/dashboard/inbox"],
  ["Brand Brain", "Company voice, audience, and approved messaging.", "/dashboard/brand"],
];

export default function CommandCenter() {
  return (
    <div>
      <h1 className="display text-4xl font-extrabold">Command Center</h1>
      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {modules.map(([title, description, href]) => (
          <Link key={href} href={href} className="glass p-6 transition hover:-translate-y-1">
            <h3 className="display text-xl font-bold">{title}</h3>
            <p className="mt-3 text-sm text-[var(--muted)]">{description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
