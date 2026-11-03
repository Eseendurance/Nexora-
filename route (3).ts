import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const status = searchParams.get("status");

  const messages = await db.inboxMessage.findMany({
    where: {
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

  const unread = await db.inboxMessage.count({ where: { status: "unread" } });
  return NextResponse.json({ messages, unread });
}

export async function PATCH(request: Request) {
  const { id, status } = await request.json();
  if (!id || !status) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const message = await db.inboxMessage.update({ where: { id }, data: { status } });
  return NextResponse.json({ message });
}
