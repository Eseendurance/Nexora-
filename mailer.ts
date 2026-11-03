import nodemailer from "nodemailer";

export function createMailer() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

export async function sendMail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  if (process.env.ENABLE_EMAIL_NOTIFICATIONS !== "true") {
    return { skipped: true };
  }

  const transporter = createMailer();

  return transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject,
    text: text ?? html.replace(/<[^>]+>/g, " "),
    html,
  });
}

export function contactNotificationEmail(data: {
  name: string;
  email: string;
  company?: string;
  subject: string;
  message: string;
}) {
  return `
    <div style="font-family:Inter,Arial,sans-serif;max-width:620px;margin:auto">
      <h2 style="color:#6D5EF8">New Nexora AI Contact Submission</h2>
      <p><strong>Name:</strong> ${data.name}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      ${data.company ? `<p><strong>Company:</strong> ${data.company}</p>` : ""}
      <p><strong>Subject:</strong> ${data.subject}</p>
      <p><strong>Message:</strong></p>
      <div style="background:#f5f5f7;padding:16px;border-radius:12px">${data.message}</div>
    </div>
  `;
}
