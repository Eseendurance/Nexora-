import { after, NextResponse } from "next/server";
import { z } from "zod";
import { createHash } from "node:crypto";
import { checkRateLimit } from "@/lib/auth";
import { db } from "@/lib/db";
import { runGemini } from "@/lib/gemini";
import { contactEmail, sendMail } from "@/lib/mailer";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  company: z.string().trim().max(200).optional(),
  phone: z.string().trim().max(50).optional(),
  subject: z.string().trim().min(2).max(200),
  message: z.string().trim().min(10).max(10000),
  source: z.string().trim().max(100).default("website"),
});

const analysisSchema = z.object({
  aiSummary: z.string().max(2000),
  aiNextAction: z.string().max(2000),
  priority: z.enum(["low", "normal", "high", "urgent"]),
});

export async function POST(request: Request) {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const parsed = schema.safeParse(input);
  if (!parsed.success) return NextResponse.json({ error: "Invalid form." }, { status: 400 });

  const data = { ...parsed.data, email: parsed.data.email.toLowerCase() };
  const rateKey = createHash("sha256").update(data.email).digest("hex");
  if (!(await checkRateLimit(`contact:${rateKey}`, 5, 60 * 60 * 1000))) {
    return NextResponse.json({ error: "Too many submissions. Try again later." }, { status: 429 });
  }

  let workspaceId: string | undefined;
  if (process.env.CONTACT_WORKSPACE_ID) {
    const workspace = await db.workspace.findUnique({
      where: { id: process.env.CONTACT_WORKSPACE_ID },
      select: { id: true },
    });
    if (workspace) workspaceId = workspace.id;
    else console.error("CONTACT_WORKSPACE_ID does not identify a workspace.");
  }

  const submission = await db.contactSubmission.create({
    data: { ...data, workspaceId, status: "new", priority: "normal" },
  });

  let inboxMessageId: string | undefined;
  try {
    const message = await db.inboxMessage.create({
      data: {
        workspaceId,
        contactId: submission.id,
        channel: "contact-form",
        subject: data.subject,
        body: data.message,
        fromName: data.name,
        fromEmail: data.email,
        aiCategory: "contact",
      },
      select: { id: true },
    });
    inboxMessageId = message.id;
  } catch (error) {
    console.error("Contact submission was saved, but inbox delivery failed.", {
      submissionId: submission.id,
      error,
    });
  }

  after(async () => {
    try {
      const analysis = await runGemini({
        task: "inbox",
        schema: analysisSchema,
        responseSchema: {
          type: "OBJECT",
          properties: {
            aiSummary: { type: "STRING" },
            aiNextAction: { type: "STRING" },
            priority: { type: "STRING", enum: ["low", "normal", "high", "urgent"] },
          },
          required: ["aiSummary", "aiNextAction", "priority"],
        },
        prompt: "Summarize this contact submission and suggest one next action. Set a priority.",
        context: JSON.stringify(data),
      });
      await db.contactSubmission.update({
        where: { id: submission.id },
        data: {
          aiSummary: analysis.aiSummary,
          aiNextAction: analysis.aiNextAction,
          priority: analysis.priority,
        },
      });
      if (inboxMessageId) {
        await db.inboxMessage.update({
          where: { id: inboxMessageId },
          data: {
            aiSummary: analysis.aiSummary,
            aiCategory: "contact",
            aiSentiment: analysis.priority,
          },
        });
      }
    } catch (error) {
      console.error("Contact submission was saved without AI enrichment.", {
        submissionId: submission.id,
        error,
      });
    }

    if (process.env.CONTACT_NOTIFY_EMAIL) {
      try {
        await sendMail({
          to: process.env.CONTACT_NOTIFY_EMAIL,
          subject: `New contact submission: ${data.subject}`,
          html: contactEmail(data),
        });
      } catch (error) {
        console.error("Contact submission was saved, but email notification failed.", {
          submissionId: submission.id,
          error,
        });
      }
    }
  });

  return NextResponse.json(
    { ok: true, id: submission.id, processing: "queued" },
    { status: 201 },
  );
}
