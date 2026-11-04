import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth";
import { db } from "@/lib/db";

const schema = z.object({
  projectId: z.string().min(1),
  voice: z.string().trim().max(1000).default("confident, clear, premium"),
  audience: z.string().trim().max(1000).default("business decision-makers"),
  products: z.string().trim().max(10000).default(""),
  competitors: z.string().trim().max(10000).default(""),
  bannedWords: z.string().trim().max(5000).default(""),
  facts: z.string().trim().max(20000).default(""),
});

async function getWorkspaceProject(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return { response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  if (session.role !== "OWNER" && session.role !== "ADMIN") {
    return { response: NextResponse.json({ error: "Workspace administrator access is required." }, { status: 403 }) };
  }

  const requestedProjectId = request.nextUrl.searchParams.get("projectId");
  const project = requestedProjectId
    ? await db.project.findFirst({
        where: { id: requestedProjectId, workspaceId: session.workspaceId },
        include: { brandBrain: true },
      })
    : await db.project.findFirst({
        where: { workspaceId: session.workspaceId },
        orderBy: { createdAt: "asc" },
        include: { brandBrain: true },
      });

  if (!project) {
    return { response: NextResponse.json({ error: "Project not found." }, { status: 404 }) };
  }

  return { session, project };
}

export async function GET(request: NextRequest) {
  const result = await getWorkspaceProject(request);
  if ("response" in result) return result.response;
  return NextResponse.json({ brain: result.project.brandBrain, projectId: result.project.id });
}

export async function POST(request: NextRequest) {
  const access = await getWorkspaceProject(request);
  if ("response" in access) return access.response;

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const parsed = schema.safeParse(input);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  if (parsed.data.projectId !== access.project.id) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const { projectId, ...data } = parsed.data;
  const brain = await db.brandBrain.upsert({
    where: { projectId },
    update: data,
    create: { projectId, ...data },
  });

  await db.auditLog.create({
    data: {
      workspaceId: access.session.workspaceId,
      actorId: access.session.userId,
      action: "brand_brain.updated",
      entityType: "brand_brain",
      entityId: brain.id,
    },
  });

  return NextResponse.json({ brain });
}
