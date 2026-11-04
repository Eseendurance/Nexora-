import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (session.role !== "OWNER" && session.role !== "ADMIN") {
    return NextResponse.json({ error: "Workspace administrator access is required." }, { status: 403 });
  }

  const projectScope = { project: { workspaceId: session.workspaceId } };
  const [members, projects, campaigns, contentAssets, jobs, contacts] = await Promise.all([
    db.workspaceMember.count({ where: { workspaceId: session.workspaceId } }),
    db.project.count({ where: { workspaceId: session.workspaceId } }),
    db.campaign.count({ where: projectScope }),
    db.contentAsset.count({ where: projectScope }),
    db.job.count({ where: projectScope }),
    db.contactSubmission.count({ where: { workspaceId: session.workspaceId } }),
  ]);

  return NextResponse.json({
    workspaceId: session.workspaceId,
    counts: { members, projects, campaigns, contentAssets, jobs, contacts },
  });
}
