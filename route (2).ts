import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { runGemini } from "@/lib/gemini";

const schema = z.object({
  message: z.string().min(1).max(8000),
  projectId: z.string().optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .max(20)
    .optional(),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  let brandContext = "";

  if (parsed.data.projectId) {
    const brain = await db.brandBrain.findUnique({
      where: { projectId: parsed.data.projectId },
    });

    if (brain) {
      brandContext = JSON.stringify({
        voice: brain.voice,
        audience: brain.audience,
        products: brain.products,
        competitors: brain.competitors,
        facts: brain.facts,
      });
    }
  }

  const result = await runGemini({
    task: "chat",
    prompt: parsed.data.message,
    context: brandContext,
  });

  return NextResponse.json({
    reply: result.answer ?? result.result ?? "I could not generate a response.",
    sources: result.sources ?? [],
    nextSteps: result.nextSteps ?? [],
  });
}
