import { NextResponse } from "next/server";
import { z } from "zod";
import { generateNarration } from "@/lib/tts";

const schema = z.object({
  narration: z.string().min(5),
  fileName: z.string().min(3),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const audio = await generateNarration(parsed.data);
  return NextResponse.json(audio);
}
