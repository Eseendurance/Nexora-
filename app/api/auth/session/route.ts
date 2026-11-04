import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, publicUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const project = await db.project.findFirst({
    where: { workspaceId: session.workspaceId },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  return NextResponse.json({
    user: publicUser(session),
    projectId: project?.id ?? null,
  });
}
