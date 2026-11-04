"use client";

import { useEffect, useState } from "react";

type CampaignPlan = {
  strategy: string;
  keyMessage: string;
  calendar: Array<{ day: number; channel: string; theme: string; asset: string }>;
  kpis: string[];
};

type Campaign = {
  id: string;
  name: string;
  objective: string;
  channels: string[];
  createdAt: string;
  plan: CampaignPlan | null;
};

const availableChannels = ["linkedin", "instagram", "x", "email", "website"];

export default function MarketingPage() {
  const [name, setName] = useState("");
  const [objective, setObjective] = useState("");
  const [audience, setAudience] = useState("business decision-makers");
  const [tone, setTone] = useState("clear, relevant, and professional");
  const [channels, setChannels] = useState<string[]>(["linkedin", "email"]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [plan, setPlan] = useState<CampaignPlan | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/marketing/campaign")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Unable to load campaigns.");
        if (active) setCampaigns(data.campaigns);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to load campaigns.");
      });
    return () => { active = false; };
  }, []);

  function toggleChannel(channel: string) {
    setChannels((current) => current.includes(channel)
      ? current.filter((value) => value !== channel)
      : [...current, channel]);
  }

  async function createCampaign(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/marketing/campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, objective, audience, tone, channels }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to create campaign.");
      setPlan(data.plan);
      setCampaigns((current) => [{ ...data.campaign, channels, plan: data.plan }, ...current]);
      setName("");
      setObjective("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to create campaign.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="display text-3xl font-bold">Marketing Autopilot</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">Turn a clear objective into a measurable, channel-aware campaign plan.</p>

      <form onSubmit={createCampaign} className="glass mt-8 space-y-5 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium">
            Campaign name
            <input required minLength={2} maxLength={160} value={name} onChange={(event) => setName(event.target.value)}
              className="surface mt-2 w-full px-4 py-3" />
          </label>
          <label className="block text-sm font-medium">
            Audience
            <input required value={audience} onChange={(event) => setAudience(event.target.value)}
              className="surface mt-2 w-full px-4 py-3" />
          </label>
        </div>
        <label className="block text-sm font-medium">
          Objective
          <textarea required minLength={5} maxLength={2000} rows={3} value={objective}
            onChange={(event) => setObjective(event.target.value)}
            placeholder="What should this campaign achieve?"
            className="surface mt-2 w-full px-4 py-3" />
        </label>
        <fieldset>
          <legend className="text-sm font-medium">Channels</legend>
          <div className="mt-3 flex flex-wrap gap-3">
            {availableChannels.map((channel) => (
              <label key={channel} className="surface flex items-center gap-2 px-3 py-2 text-sm capitalize">
                <input type="checkbox" checked={channels.includes(channel)} onChange={() => toggleChannel(channel)} />
                {channel}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="block text-sm font-medium">
          Tone
          <input value={tone} onChange={(event) => setTone(event.target.value)}
            className="surface mt-2 w-full px-4 py-3" />
        </label>
        <button disabled={busy} className="rounded-full bg-[var(--accent)] px-6 py-3 font-semibold text-white disabled:opacity-50">
          {busy ? "Building plan…" : "Create campaign plan"}
        </button>
        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
      </form>

      {plan && (
        <section className="mt-8 space-y-5">
          <div className="glass p-6">
            <p className="text-xs uppercase tracking-widest text-[var(--cyan)]">Campaign strategy</p>
            <p className="mt-3 leading-relaxed">{plan.strategy}</p>
            <p className="mt-4 text-sm text-[var(--muted)]"><strong>Key message:</strong> {plan.keyMessage}</p>
            <p className="mt-3 text-sm text-[var(--muted)]"><strong>KPIs:</strong> {plan.kpis.join(" · ")}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {plan.calendar.map((item, index) => (
              <article key={`${item.day}-${index}`} className="glass p-5">
                <p className="text-xs uppercase tracking-widest text-[var(--accent)]">Day {item.day} · {item.channel}</p>
                <h2 className="display mt-2 font-semibold">{item.theme}</h2>
                <p className="mt-2 text-sm text-[var(--muted)]">{item.asset}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="display text-xl font-bold">Campaign history</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {campaigns.map((campaign) => (
            <button key={campaign.id} onClick={() => setPlan(campaign.plan)} className="glass w-full p-5 text-left">
              <h3 className="font-semibold">{campaign.name}</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">{campaign.objective}</p>
              <p className="mt-3 text-xs capitalize text-[var(--cyan)]">{campaign.channels.join(" · ")}</p>
            </button>
          ))}
          {campaigns.length === 0 && <p className="text-sm text-[var(--muted)]">No campaigns yet.</p>}
        </div>
      </section>
    </div>
  );
}
