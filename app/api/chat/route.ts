import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getSessionFromRequest } from "@/lib/auth";
import { db } from "@/lib/db";
import { runGemini } from "@/lib/gemini";

const schema = z.object({
  message: z.string().trim().min(1).max(12000),
  projectId: z.string().optional(),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().max(12000),
  })).max(20).optional(),
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

  const project = parsed.data.projectId
    ? await db.project.findFirst({
        where: { id: parsed.data.projectId, workspaceId: session.workspaceId },
        include: { brandBrain: true },
      })
    : await db.project.findFirst({
        where: { workspaceId: session.workspaceId },
        orderBy: { createdAt: "asc" },
        include: { brandBrain: true },
      });
  if (parsed.data.projectId && !project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const result = await runGemini({
    task: "chat",
    schema: z.object({ answer: z.string().min(1) }),
    responseSchema: {
      type: "OBJECT",
      properties: { answer: { type: "STRING" } },
      required: ["answer"],
    },
    prompt: parsed.data.message,
    context: project?.brandBrain ? JSON.stringify(project.brandBrain) : "",
    history: parsed.data.history,
  });

  return NextResponse.json({
    reply: result.answer,
  });
}
