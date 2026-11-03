import { NextResponse } from "next/server";
import { z } from "zod";
import { runGemini } from "@/lib/gemini";

const schema = z.object({
  goal: z.string().min(5),
  platform: z.enum(["linkedin", "instagram", "x", "tiktok", "youtube", "facebook"]),
  audience: z.string().default("business decision-makers"),
  tone: z.string().default("professional, confident"),
  days: z.number().int().min(1).max(30).default(7),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const plan = await runGemini({
    task: "social",
    prompt: `Create a ${parsed.data.days}-day ${parsed.data.platform} content plan.
Goal: ${parsed.data.goal}. Audience: ${parsed.data.audience}. Tone: ${parsed.data.tone}.
Return JSON with strategy, pillars, calendar, and kpis.`,
  });

  return NextResponse.json(plan);
}
