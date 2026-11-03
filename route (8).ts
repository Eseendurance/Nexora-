import { NextResponse } from "next/server";
import { z } from "zod";
import { runGemini } from "@/lib/gemini";
import { extractWebsite } from "@/lib/scraper";

const schema = z.object({
  url: z.string().url(),
  prompt: z.string().min(10),
  durationSeconds: z.number().int().min(20).max(180).default(60),
  audience: z.string().default("business decision-makers"),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const website = await extractWebsite(parsed.data.url);

  const storyboard = await runGemini({
    task: "video_script",
    prompt: `Create a ${parsed.data.durationSeconds}-second website presentation video.
Creative direction: ${parsed.data.prompt}.
Audience: ${parsed.data.audience}.

Return JSON:
{
  "title": string,
  "hook": string,
  "callToAction": string,
  "slides": [
    {
      "headline": string,
      "subheadline": string,
      "narration": string,
      "visualDirection": string,
      "durationSeconds": number
    }
  ]
}`,
    context: JSON.stringify(website),
  });

  return NextResponse.json({ website, storyboard });
}
