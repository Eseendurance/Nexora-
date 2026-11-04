import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth";
import { generateNarration } from "@/lib/tts";

const schema = z.object({
  narration: z.string().trim().min(5).max(12000),
  fileName: z.string().regex(/^[a-zA-Z0-9_-]{3,80}$/),
});

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const parsed = schema.safeParse(input);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  const audio = await generateNarration({
    text: parsed.data.narration,
    fileName: parsed.data.fileName,
  });
  return NextResponse.json(audio);
}
