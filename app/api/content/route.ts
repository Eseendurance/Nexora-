import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getSessionFromRequest } from "@/lib/auth";
import { db } from "@/lib/db";
import { runGemini } from "@/lib/gemini";

const requestSchema = z.object({
  kind: z.enum([
    "blog_post", "email", "linkedin_post", "x_thread", "landing_page",
    "product_description", "ad_copy", "video_script", "proposal",
  ]),
  prompt: z.string().trim().min(10).max(5000),
  audience: z.string().trim().max(500).default("business decision-makers"),
  tone: z.string().trim().max(500).default("clear, confident, and useful"),
});

const outputSchema = z.object({
  title: z.string().min(1).max(300),
  content: z.string().min(1).max(30000),
  summary: z.string().max(2000),
});

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const assets = await db.contentAsset.findMany({
    where: { project: { workspaceId: session.workspaceId } },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, kind: true, title: true, content: true, createdAt: true },
  });
  return NextResponse.json({ assets });
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
  if (!parsed.success) return NextResponse.json({ error: "Invalid content request." }, { status: 400 });

  const project = await db.project.findFirst({
    where: { workspaceId: session.workspaceId },
    orderBy: { createdAt: "asc" },
    include: { brandBrain: true },
  });
  if (!project) return NextResponse.json({ error: "Workspace project not found." }, { status: 404 });

  const generated = await runGemini({
    task: "content",
    schema: outputSchema,
    responseSchema: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING" },
        content: { type: "STRING" },
        summary: { type: "STRING" },
      },
      required: ["title", "content", "summary"],
    },
    prompt: `Create a ${parsed.data.kind.replaceAll("_", " ")}.
Brief: ${parsed.data.prompt}
Audience: ${parsed.data.audience}
Tone: ${parsed.data.tone}
Return a complete, polished draft.`,
    context: project.brandBrain ? JSON.stringify(project.brandBrain) : "",
  });

  const asset = await db.contentAsset.create({
    data: {
      projectId: project.id,
      kind: parsed.data.kind,
      title: generated.title,
      content: generated.content,
    },
    select: { id: true, kind: true, title: true, content: true, createdAt: true },
  });

  await db.auditLog.create({
    data: {
      workspaceId: session.workspaceId,
      actorId: session.userId,
      action: "content.created",
      entityType: "content_asset",
      entityId: asset.id,
    },
  });

  return NextResponse.json({ asset, summary: generated.summary }, { status: 201 });
}
