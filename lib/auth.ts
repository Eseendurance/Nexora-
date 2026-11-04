import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export { hashPassword, verifyPassword } from "@/lib/password";

export const SESSION_COOKIE = "nexora_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
let lastRateLimitCleanup = 0;

export type AuthSession = {
  userId: string;
  email: string;
  name: string | null;
  workspaceId: string;
  workspaceName: string;
  role: string;
};

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(
  response: NextResponse,
  userId: string,
  workspaceId: string,
) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.session.create({
    data: { tokenHash: hashToken(token), userId, workspaceId, expiresAt },
  });

  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

async function findSession(token?: string): Promise<AuthSession | null> {
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true, workspace: true },
  });
  if (!session || session.expiresAt <= new Date()) return null;

  const membership = await db.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: session.workspaceId,
        userId: session.userId,
      },
    },
  });
  if (!membership) return null;

  return {
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
    workspaceId: session.workspace.id,
    workspaceName: session.workspace.name,
    role: membership.role,
  };
}

export async function getSessionFromRequest(request: NextRequest) {
  return findSession(request.cookies.get(SESSION_COOKIE)?.value);
}

export async function getCurrentSession() {
  const cookieStore = await cookies();
  return findSession(cookieStore.get(SESSION_COOKIE)?.value);
}

export async function clearSession(response: NextResponse, token?: string) {
  if (token) {
    await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);
  if (Date.now() - lastRateLimitCleanup > 60 * 60 * 1000) {
    await db.rateLimitHit.deleteMany({
      where: { createdAt: { lt: new Date(now.getTime() - 60 * 60 * 1000) } },
    });
    lastRateLimitCleanup = Date.now();
  }
  await db.rateLimitHit.deleteMany({
    where: { key, createdAt: { lt: windowStart } },
  });
  await db.rateLimitHit.create({ data: { key } });
  const count = await db.rateLimitHit.count({
    where: { key, createdAt: { gte: windowStart } },
  });
  return count <= limit;
}

export function publicUser(session: AuthSession) {
  return {
    id: session.userId,
    email: session.email,
    name: session.name,
    workspace: { id: session.workspaceId, name: session.workspaceName },
    role: session.role,
  };
}
