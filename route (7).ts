import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { videoQueue } from "@/lib/queue";

const schema = z.object({
  projectId: z.string(),
  title: z.string(),
  slides: z.array(
    z.object({
      headline: z.string(),
      subheadline: z.string().optional(),
      narration: z.string(),
      visualDirection: z.string().optional(),
      durationSeconds: z.number(),
    })
  ),
  audioUrl: z.string(),
  brandColor: z.string().default("#6D5EF8"),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const job = await db.job.create({
    data: {
      projectId: parsed.data.projectId,
      type: "VIDEO",
      status: "QUEUED",
      input: JSON.stringify(parsed.data),
    },
  });

  await videoQueue.add("render-video", {
    jobId: job.id,
    ...parsed.data,
  });

  return NextResponse.json({ jobId: job.id, status: "QUEUED" });
}
