import "server-only";

import { z } from "zod";

const BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const RETRY_DELAY_MS = 350;

export type Task =
  | "chat" | "content" | "social" | "bizdev"
  | "marketing" | "inbox" | "video_script";

export type ConversationTurn = {
  role: "user" | "assistant";
  content: string;
};

const personas: Record<Task, string> = {
  chat: "You are Nexora, an elite AI chief of staff. Be accurate, structured, and actionable.",
  content: "You are Nexora, a senior brand content strategist. Create high-converting content.",
  social: "You are Nexora, a social media director. Create platform-native content systems.",
  bizdev: "You are Nexora, a business development director. Qualify leads and create outreach.",
  marketing: "You are Nexora, a growth marketing strategist. Build measurable campaigns.",
  inbox: "You are Nexora, an inbox analyst. Classify, summarize, and prioritize messages.",
  video_script: "You are Nexora, a short-form video director. Create slide storyboards.",
};

export async function runGemini<T>({
  task,
  prompt,
  context,
  history = [],
  schema,
  responseSchema,
  temperature = 0.65,
}: {
  task: Task;
  prompt: string;
  context?: string;
  history?: ConversationTurn[];
  schema: z.ZodType<T>;
  responseSchema?: Record<string, unknown>;
  temperature?: number;
}) {
  const key = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";

  if (!key) throw new Error("GEMINI_API_KEY is missing");

  const contents = history.map((turn) => ({
    role: turn.role === "assistant" ? "model" : "user",
    parts: [{ text: turn.content }],
  }));
  contents.push({
    role: "user",
    parts: [{
      text: `Context:\n${context ?? "None"}\n\nRequest:\n${prompt}\n\nReturn valid JSON only.`,
    }],
  });

  let correction = "";
  let lastError: Error | undefined;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    try {
      const response = await fetch(`${BASE}/${encodeURIComponent(model)}:generateContent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": key,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: personas[task] }] },
          contents: attempt === 0
            ? contents
            : [
                ...contents,
                {
                  role: "user",
                  parts: [{
                    text: `Correct the previous response. It failed validation: ${correction}. Return only JSON matching the requested structure.`,
                  }],
                },
              ],
          generationConfig: {
            temperature,
            responseMimeType: "application/json",
            ...(responseSchema ? { responseSchema } : {}),
          },
        }),
        signal: AbortSignal.timeout(30_000),
      });

      if (!response.ok) {
        const status = response.status;
        if (attempt === 0 && (status === 429 || status >= 500)) {
          lastError = new Error(`Gemini returned HTTP ${status}.`);
          console.warn("Gemini request will be retried.", { task, status });
          continue;
        }
        throw new Error(`Gemini request failed with HTTP ${status}.`);
      }

      const data: unknown = await response.json();
      const envelope = z.object({
        candidates: z.array(z.object({
          content: z.object({
            parts: z.array(z.object({ text: z.string() })).min(1),
          }),
        })).min(1),
      }).safeParse(data);
      if (!envelope.success) {
        correction = "the response did not contain a valid candidate";
        lastError = new Error("Gemini returned an invalid response envelope.");
        console.warn("Gemini returned an invalid response envelope.", { task, attempt: attempt + 1 });
        continue;
      }

      const text = envelope.data.candidates[0].content.parts[0].text;
      let json: unknown;
      try {
        json = JSON.parse(text);
      } catch {
        correction = "the response was not valid JSON";
        lastError = new Error("Gemini returned malformed JSON.");
        console.warn("Gemini returned malformed JSON.", { task, attempt: attempt + 1 });
        continue;
      }
      const validated = schema.safeParse(json);
      if (validated.success) return validated.data;

      correction = validated.error.issues
        .slice(0, 8)
        .map((issue) => `${issue.path.join(".") || "response"}: ${issue.message}`)
        .join("; ");
      lastError = new Error("Gemini response failed schema validation.");
      console.warn("Gemini response failed validation.", { task, attempt: attempt + 1 });
    } catch (error) {
      if (attempt === 0 && error instanceof TypeError) {
        lastError = error;
        console.warn("Gemini network request will be retried.", { task });
        continue;
      }
      console.error("Gemini request failed.", { task, attempt: attempt + 1, error });
      throw new Error("Gemini could not produce a valid response.", { cause: error });
    }
  }

  console.error("Gemini response remained invalid after one retry.", { task, error: lastError });
  throw new Error("Gemini could not produce a valid response after one retry.", {
    cause: lastError,
  });
}
