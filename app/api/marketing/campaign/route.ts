import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getSessionFromRequest } from "@/lib/auth";
import { db } from "@/lib/db";
import { runGemini } from "@/lib/gemini";

const requestSchema = z.object({
  name: z.string().trim().min(2).max(160),
  objective: z.string().trim().min(5).max(2000),
  channels: z.array(z.enum(["linkedin", "instagram", "x", "email", "website"])).min(1).max(5),
  audience: z.string().trim().min(2).max(500),
  tone: z.string().trim().max(300).default("clear, relevant, and professional"),
});

const planSchema = z.object({
  strategy: z.string().min(1).max(5000),
  keyMessage: z.string().min(1).max(2000),
  calendar: z.array(z.object({
    day: z.number().int().positive(),
    channel: z.string(),
    theme: z.string(),
    asset: z.string(),
  })).min(1).max(30),
  kpis: z.array(z.string()).min(1).max(20),
});

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const storedCampaigns = await db.campaign.findMany({
    where: { project: { workspaceId: session.workspaceId } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const campaigns = [];
  for (const campaign of storedCampaigns) {
    let channelsValue: unknown;
    try {
      channelsValue = JSON.parse(campaign.channels);
    } catch (error) {
      console.error("Stored campaign channels are invalid JSON.", { campaignId: campaign.id, error });
      return NextResponse.json({ error: "Campaign data could not be loaded." }, { status: 500 });
    }

    const parsedChannels = z.array(
      z.enum(["linkedin", "instagram", "x", "email", "website"]),
    ).safeParse(channelsValue);
    if (!parsedChannels.success) {
      console.error("Stored campaign channels failed validation.", { campaignId: campaign.id });
      return NextResponse.json({ error: "Campaign data could not be loaded." }, { status: 500 });
    }
    let plan: unknown = null;
    if (campaign.plan) {
      try {
        plan = planSchema.parse(JSON.parse(campaign.plan));
      } catch (error) {
        console.error("Stored campaign plan is invalid.", { campaignId: campaign.id, error });
        return NextResponse.json({ error: "Campaign data could not be loaded." }, { status: 500 });
      }
    }
    campaigns.push({ ...campaign, channels: parsedChannels.data, plan });
  }
  return NextResponse.json({ campaigns });
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!(await checkRateLimit(`ai:${session.userId}`, 30, 60 * 1000))) {
    return NextResponse.json({ error: "AI request limit reached. Try again in a minute." }, { status: 429 });
  }

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) return NextResponse.json({ error: "Invalid campaign request." }, { status: 400 });

  const project = await db.project.findFirst({
    where: { workspaceId: session.workspaceId },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!project) return NextResponse.json({ error: "Workspace project not found." }, { status: 404 });

  const plan = await runGemini({
    task: "marketing",
    schema: planSchema,
    responseSchema: {
      type: "OBJECT",
      properties: {
        strategy: { type: "STRING" },
        keyMessage: { type: "STRING" },
        calendar: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              day: { type: "INTEGER" },
              channel: { type: "STRING" },
              theme: { type: "STRING" },
              asset: { type: "STRING" },
            },
            required: ["day", "channel", "theme", "asset"],
          },
        },
        kpis: { type: "ARRAY", items: { type: "STRING" } },
      },
      required: ["strategy", "keyMessage", "calendar", "kpis"],
    },
    prompt: `Create an actionable campaign for this objective: ${parsed.data.objective}
Channels: ${parsed.data.channels.join(", ")}.
Audience: ${parsed.data.audience}.
Tone: ${parsed.data.tone}.
Return a strategy, key message, day-by-day calendar, and measurable KPIs.`,
  });

  const campaign = await db.campaign.create({
    data: {
      projectId: project.id,
      name: parsed.data.name,
      objective: parsed.data.objective,
      channels: JSON.stringify(parsed.data.channels),
      plan: JSON.stringify(plan),
      status: "draft",
    },
  });
  await db.auditLog.create({
    data: {
      workspaceId: session.workspaceId,
      actorId: session.userId,
      action: "campaign.created",
      entityType: "campaign",
      entityId: campaign.id,
    },
  });

  return NextResponse.json({ campaign, plan }, { status: 201 });
}
