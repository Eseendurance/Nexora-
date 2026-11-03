import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const schema = z.object({
  projectId: z.string(),
  voice: z.string().default("confident, clear, premium"),
  audience: z.string().default("business decision-makers"),
  products: z.string().default(""),
  competitors: z.string().default(""),
  bannedWords: z.string().default(""),
  facts: z.string().default(""),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const brain = await db.brandBrain.upsert({
    where: { projectId: parsed.data.projectId },
    update: parsed.data,
    create: parsed.data,
  });

  return NextResponse.json({ brain });
}
