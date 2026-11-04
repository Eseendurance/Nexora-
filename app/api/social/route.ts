import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getSessionFromRequest } from "@/lib/auth";
import { runGemini } from "@/lib/gemini";

const schema = z.object({
  goal: z.string().trim().min(5).max(2000),
  platform: z.enum(["linkedin", "instagram", "x", "tiktok", "youtube", "facebook"]),
  audience: z.string().trim().max(500).default("business decision-makers"),
  tone: z.string().trim().max(500).default("professional, confident"),
  days: z.number().int().min(1).max(30).default(7),
});

const planSchema = z.object({
  strategy: z.string(),
  pillars: z.array(z.string()),
  calendar: z.array(z.object({
    day: z.number().int().positive(),
    format: z.string(),
    hook: z.string(),
    caption: z.string(),
  })).min(1),
  kpis: z.array(z.string()),
});

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
  const parsed = schema.safeParse(input);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const plan = await runGemini({
    task: "social",
    schema: planSchema,
    responseSchema: {
      type: "OBJECT",
      properties: {
        strategy: { type: "STRING" },
        pillars: { type: "ARRAY", items: { type: "STRING" } },
        calendar: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              day: { type: "INTEGER" },
              format: { type: "STRING" },
              hook: { type: "STRING" },
              caption: { type: "STRING" },
            },
            required: ["day", "format", "hook", "caption"],
          },
        },
        kpis: { type: "ARRAY", items: { type: "STRING" } },
      },
      required: ["strategy", "pillars", "calendar", "kpis"],
    },
    prompt: `Create a ${parsed.data.days}-day ${parsed.data.platform} content plan.
Goal: ${parsed.data.goal}. Audience: ${parsed.data.audience}. Tone: ${parsed.data.tone}.
Return JSON with strategy, pillars, calendar, and kpis.`,
  });

  return NextResponse.json(plan);
}
