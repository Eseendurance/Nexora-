import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  checkRateLimit,
  createSession,
  verifyPassword,
} from "@/lib/auth";
import { db } from "@/lib/db";

const schema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
});

export async function POST(request: NextRequest) {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const rateKey = createHash("sha256").update(email).digest("hex");
  if (!(await checkRateLimit(`login:${rateKey}`, 8, 15 * 60 * 1000))) {
    return NextResponse.json(
      { error: "Too many sign-in attempts. Try again in 15 minutes." },
      { status: 429 },
    );
  }

  const user = await db.user.findUnique({
    where: { email },
    include: { memberships: { orderBy: { createdAt: "asc" }, take: 1 } },
  });
  const fallbackHash = `scrypt$${"0".repeat(32)}$${"0".repeat(128)}`;
  const passwordMatches = await verifyPassword(
    parsed.data.password,
    user?.passwordHash ?? fallbackHash,
  );
  const membership = user?.memberships[0];

  if (!user || !user.passwordHash || !passwordMatches || !membership) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  await db.rateLimitHit.deleteMany({ where: { key: `login:${rateKey}` } });
  await db.auditLog.create({
    data: {
      workspaceId: membership.workspaceId,
      actorId: user.id,
      action: "auth.login",
      entityType: "user",
      entityId: user.id,
    },
  });

  const response = NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name },
  });
  await createSession(response, user.id, membership.workspaceId);
  return response;
}
