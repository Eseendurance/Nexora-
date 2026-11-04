import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { id } = await params;

  const job = await db.job.findFirst({
    where: { id, project: { workspaceId: session.workspaceId } },
  });
  if (!job) return NextResponse.json({ error: "Job not found." }, { status: 404 });

  let output: unknown = null;
  if (job.output) {
    try {
      output = JSON.parse(job.output);
    } catch (error) {
      console.error("Stored job output is invalid JSON.", { jobId: job.id, error });
      return NextResponse.json({ error: "Job output is unavailable." }, { status: 500 });
    }
  }

  return NextResponse.json({
    id: job.id,
    status: job.status,
    progress: job.progress,
    output,
    error: job.error,
  });
}
