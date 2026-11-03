import "server-only";

const BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export type Task =
  | "chat" | "content" | "social" | "bizdev"
  | "marketing" | "inbox" | "video_script";

const personas: Record<Task, string> = {
  chat: "You are Nexora, an elite AI chief of staff. Be accurate, structured, and actionable.",
  content: "You are Nexora, a senior brand content strategist. Create high-converting content.",
  social: "You are Nexora, a social media director. Create platform-native content systems.",
  bizdev: "You are Nexora, a business development director. Qualify leads and create outreach.",
  marketing: "You are Nexora, a growth marketing strategist. Build measurable campaigns.",
  inbox: "You are Nexora, an inbox analyst. Classify, summarize, and prioritize messages.",
  video_script: "You are Nexora, a short-form video director. Create slide storyboards.",
};

export async function runGemini({
  task, prompt, context, temperature = 0.65,
}: { task: Task; prompt: string; context?: string; temperature?: number }) {
  const key = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";

  if (!key) throw new Error("GEMINI_API_KEY is missing");

  const res = await fetch(`${BASE}/${model}:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: personas[task] }] },
      contents: [{
        role: "user",
        parts: [{ text: `Context:\n${context ?? "None"}\n\nRequest:\n${prompt}\n\nReturn valid JSON only.` }],
      }],
      generationConfig: { temperature, responseMimeType: "application/json" },
    }),
  });

  if (!res.ok) throw new Error(`Gemini failed: ${res.status} ${await res.text()}`);

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

  try { return JSON.parse(text); } catch { return { result: text }; }
}
