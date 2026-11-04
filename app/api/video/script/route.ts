import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getSessionFromRequest } from "@/lib/auth";
import { runGemini } from "@/lib/gemini";
import { extractWebsite } from "@/lib/scraper";

const schema = z.object({
  url: z.string().url(),
  prompt: z.string().trim().min(10).max(2000),
  durationSeconds: z.number().int().min(20).max(180).default(60),
  audience: z.string().trim().min(2).max(300).default("business decision-makers"),
});

const storyboardSchema = z.object({
  title: z.string().min(1),
  hook: z.string().min(1),
  callToAction: z.string().min(1),
  slides: z.array(z.object({
    headline: z.string().min(1),
    subheadline: z.string(),
    narration: z.string().min(1),
    visualDirection: z.string(),
    durationSeconds: z.number().positive(),
  })).min(1),
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
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  const website = await extractWebsite(parsed.data.url);
  const storyboard = await runGemini({
    task: "video_script",
    schema: storyboardSchema,
    responseSchema: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING" },
        hook: { type: "STRING" },
        callToAction: { type: "STRING" },
        slides: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              headline: { type: "STRING" },
              subheadline: { type: "STRING" },
              narration: { type: "STRING" },
              visualDirection: { type: "STRING" },
              durationSeconds: { type: "NUMBER" },
            },
            required: ["headline", "subheadline", "narration", "visualDirection", "durationSeconds"],
          },
        },
      },
      required: ["title", "hook", "callToAction", "slides"],
    },
    prompt: `Create a ${parsed.data.durationSeconds}-second website presentation video.
Creative direction: ${parsed.data.prompt}.
Audience: ${parsed.data.audience}.
Return JSON with title, hook, callToAction, and slides. Every slide needs headline,
subheadline, narration, visualDirection, and durationSeconds.`,
    context: JSON.stringify(website),
  });

  return NextResponse.json({ website, storyboard });
}
