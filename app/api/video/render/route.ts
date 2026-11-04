import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth";
import { db } from "@/lib/db";
import { videoQueue } from "@/lib/queue";

const schema = z.object({
  projectId: z.string().min(1),
  title: z.string().trim().min(1).max(200),
  slides: z.array(z.object({
    headline: z.string().trim().min(1).max(300),
    subheadline: z.string().max(500).optional(),
    narration: z.string().trim().min(1).max(3000),
    visualDirection: z.string().max(1000).optional(),
    durationSeconds: z.number().min(1).max(180),
  })).min(1).max(30),
  audioUrl: z.string().max(1000),
  brandColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#6D5EF8"),
});

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const parsed = schema.safeParse(input);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  const project = await db.project.findFirst({
    where: { id: parsed.data.projectId, workspaceId: session.workspaceId },
    select: { id: true },
  });
  if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });

  const job = await db.job.create({
    data: {
      projectId: project.id,
      type: "VIDEO",
      status: "QUEUED",
      input: JSON.stringify(parsed.data),
    },
  });

  try {
    await videoQueue.add("render-video", { jobId: job.id, ...parsed.data });
  } catch (error) {
    await db.job.update({
      where: { id: job.id },
      data: { status: "FAILED", error: "The video worker queue is unavailable." },
    });
    console.error("Video render job could not be queued.", { jobId: job.id, error });
    return NextResponse.json({ error: "The video job could not be queued." }, { status: 503 });
  }

  return NextResponse.json({ jobId: job.id, status: "QUEUED" }, { status: 202 });
}
