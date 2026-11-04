import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, createSession, hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  password: z.string().min(12).max(128),
  workspaceName: z.string().trim().min(2).max(100),
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
    return NextResponse.json(
      { error: "Invalid registration details.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase();
  const rateKey = createHash("sha256").update(email).digest("hex");
  if (!(await checkRateLimit(`register:${rateKey}`, 4, 60 * 60 * 1000))) {
    return NextResponse.json({ error: "Too many registration attempts. Try again later." }, { status: 429 });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  try {
    const account = await db.$transaction(async (transaction) => {
      const user = await transaction.user.create({
        data: {
          name: parsed.data.name,
          email,
          passwordHash,
        },
      });
      const workspace = await transaction.workspace.create({
        data: {
          name: parsed.data.workspaceName,
          slug: `${parsed.data.workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "workspace"}-${user.id.slice(-6)}`,
        },
      });

      await transaction.workspaceMember.create({
        data: { workspaceId: workspace.id, userId: user.id, role: "OWNER" },
      });
      const project = await transaction.project.create({
        data: {
          name: "Main project",
          ownerId: user.id,
          workspaceId: workspace.id,
        },
      });
      await transaction.brandBrain.create({
        data: {
          projectId: project.id,
          products: "",
          competitors: "",
          bannedWords: "",
          facts: "",
        },
      });
      await transaction.auditLog.create({
        data: {
          workspaceId: workspace.id,
          actorId: user.id,
          action: "workspace.created",
          entityType: "workspace",
          entityId: workspace.id,
        },
      });

      return { user, workspace };
    });

    const response = NextResponse.json({
      user: {
        id: account.user.id,
        email: account.user.email,
        name: account.user.name,
      },
      workspace: { id: account.workspace.id, name: account.workspace.name },
    }, { status: 201 });
    await createSession(response, account.user.id, account.workspace.id);
    return response;
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
    }

    console.error("Registration failed.", error);
    return NextResponse.json({ error: "Registration could not be completed." }, { status: 500 });
  }
}
