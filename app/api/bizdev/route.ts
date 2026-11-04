import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getSessionFromRequest } from "@/lib/auth";
import { runGemini } from "@/lib/gemini";

const schema = z.object({
  company: z.string().trim().min(2).max(200),
  website: z.string().url().optional(),
  offer: z.string().trim().min(5).max(2000),
  targetRole: z.string().trim().max(200).default("Founder or Head of Growth"),
  objective: z.enum(["lead_research", "outreach", "proposal", "follow_up"]),
});

const resultSchema = z.object({
  opportunityScore: z.number().min(0).max(100),
  qualification: z.string(),
  painPoints: z.array(z.string()),
  valueHypothesis: z.string(),
  subjectLines: z.array(z.string()),
  outreachMessage: z.string(),
  followUpSequence: z.array(z.string()),
  objectionHandling: z.array(z.string()),
  nextActions: z.array(z.string()),
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

  const result = await runGemini({
    task: "bizdev",
    schema: resultSchema,
    responseSchema: {
      type: "OBJECT",
      properties: {
        opportunityScore: { type: "NUMBER" },
        qualification: { type: "STRING" },
        painPoints: { type: "ARRAY", items: { type: "STRING" } },
        valueHypothesis: { type: "STRING" },
        subjectLines: { type: "ARRAY", items: { type: "STRING" } },
        outreachMessage: { type: "STRING" },
        followUpSequence: { type: "ARRAY", items: { type: "STRING" } },
        objectionHandling: { type: "ARRAY", items: { type: "STRING" } },
        nextActions: { type: "ARRAY", items: { type: "STRING" } },
      },
      required: [
        "opportunityScore", "qualification", "painPoints", "valueHypothesis",
        "subjectLines", "outreachMessage", "followUpSequence", "objectionHandling", "nextActions",
      ],
    },
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
