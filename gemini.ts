import "server-only";

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models";

export type NexoraTask =
  | "chat"
  | "content"
  | "social"
  | "bizdev"
  | "marketing"
  | "inbox"
  | "video_script";

const personas: Record<NexoraTask, string> = {
  chat: `You are Nexora, an elite AI chief of staff. Answer accurately, structure complex topics, identify assumptions, and provide actionable next steps.`,
  content: `You are Nexora, a senior brand content strategist. Create original, high-converting, channel-ready content.`,
  social: `You are Nexora, a social media director. Create native posts, hooks, captions, hashtags, calendars, and engagement strategies.`,
  bizdev: `You are Nexora, a business development director. Identify opportunities, qualify leads, write outreach, proposals, follow-ups, and partnership strategies.`,
  marketing: `You are Nexora, a growth marketing strategist. Build measurable campaigns with positioning, audience, channels, creative, budget, and KPIs.`,
  inbox: `You are Nexora, an executive inbox analyst. Classify messages, summarize intent, detect urgency, and recommend the next action.`,
  video_script: `You are Nexora, a short-form video director. Create concise slide-by-slide storyboards with narration and visual direction.`,
};

export async function runGemini({
  task,
  prompt,
  context,
  temperature = 0.65,
}: {
  task: NexoraTask;
  prompt: string;
  context?: string;
  temperature?: number;
}) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";

  if (!apiKey) throw new Error("GEMINI_API_KEY is missing");

  const res = await fetch(
    `${GEMINI_URL}/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: personas[task] }],
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Context:\n${context ?? "None"}\n\nRequest:\n${prompt}\n\nReturn valid JSON only.`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Gemini request failed: ${res.status} ${detail}`);
  }

  const data = await res.json();
  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

  try {
    return JSON.parse(text);
  } catch {
    return { result: text };
  }
}
