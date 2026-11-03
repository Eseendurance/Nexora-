import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { runGemini } from "@/lib/gemini";
import { contactNotificationEmail, sendMail } from "@/lib/mailer";

const schema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  company: z.string().max(160).optional(),
  phone: z.string().max(40).optional(),
  subject: z.string().min(2).max(180),
  message: z.string().min(10).max(5000),
  source: z.string().default("website"),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please complete the form correctly.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  let aiSummary = "";
  let aiNextAction = "";
  let priority = "normal";

  try {
    const analysis = await runGemini({
      task: "inbox",
      prompt: `Analyze this contact submission. Return JSON:
      {"aiSummary":string,"aiNextAction":string,"priority":"low"|"normal"|"high"|"urgent","category":string,"sentiment":string}`,
      context: JSON.stringify(data),
    });

    aiSummary = analysis.aiSummary ?? "";
    aiNextAction = analysis.aiNextAction ?? "";
    priority = analysis.priority ?? "normal";
  } catch {
    // Contact capture must never fail because AI analysis is unavailable.
  }

  const submission = await db.contactSubmission.create({
    data: {
      ...data,
      priority,
      aiSummary,
      aiNextAction,
    },
  });

  await db.inboxMessage.create({
    data: {
      contactId: submission.id,
      direction: "inbound",
      channel: "contact-form",
      subject: data.subject,
      body: data.message,
      fromName: data.name,
      fromEmail: data.email,
      aiSummary,
      aiCategory: "contact",
    },
  });

  const notifyEmail = process.env.CONTACT_NOTIFY_EMAIL;

  if (notifyEmail) {
    try {
      await sendMail({
        to: notifyEmail,
        subject: `New contact submission: ${data.subject}`,
        html: contactNotificationEmail(data),
      });
    } catch {
      // Keep submission even if SMTP is temporarily unavailable.
    }
  }

  return NextResponse.json({
    ok: true,
    id: submission.id,
    message: "Your message has been received.",
  });
}
