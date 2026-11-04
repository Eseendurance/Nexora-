import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth";
import { db } from "@/lib/db";

const updateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["unread", "read", "archived"]),
});

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const q = request.nextUrl.searchParams.get("q")?.trim().slice(0, 200);
  const statusParam = request.nextUrl.searchParams.get("status");
  const status = statusParam && ["unread", "read", "archived"].includes(statusParam)
    ? statusParam
    : undefined;

  const messages = await db.inboxMessage.findMany({
    where: {
      workspaceId: session.workspaceId,
      AND: [
        status ? { status } : {},
        q ? {
          OR: [
            { subject: { contains: q } },
            { body: { contains: q } },
            { fromEmail: { contains: q } },
          ],
        } : {},
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const unread = await db.inboxMessage.count({
    where: { workspaceId: session.workspaceId, status: "unread" },
  });
  return NextResponse.json({ messages, unread });
}

export async function PATCH(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return NextResponse.json({ error: "Invalid inbox update." }, { status: 400 });

  const message = await db.inboxMessage.findFirst({
    where: { id: parsed.data.id, workspaceId: session.workspaceId },
    select: { id: true },
  });
  if (!message) return NextResponse.json({ error: "Message not found." }, { status: 404 });

  await db.inboxMessage.update({
    where: { id: message.id },
    data: { status: parsed.data.status },
  });
  return NextResponse.json({ message });
}
