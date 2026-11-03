import { NextResponse } from "next/server";
import { z } from "zod";
import { runGemini } from "@/lib/gemini";

const schema = z.object({
  company: z.string().min(2),
  website: z.string().url().optional(),
  offer: z.string().min(5),
  targetRole: z.string().default("Founder or Head of Growth"),
  objective: z.enum(["lead_research", "outreach", "proposal", "follow_up"]),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const result = await runGemini({
    task: "bizdev",
    prompt: `Objective: ${parsed.data.objective}.
Company: ${parsed.data.company}.
Website: ${parsed.data.website ?? "Not provided"}.
Offer: ${parsed.data.offer}.
Target role: ${parsed.data.targetRole}.

Return JSON with opportunityScore, qualification, painPoints, valueHypothesis,
subjectLines, outreachMessage, followUpSequence, objectionHandling, nextActions.`,
  });

  return NextResponse.json(result);
}
