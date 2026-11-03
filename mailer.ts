import nodemailer from "nodemailer";

export function createMailer() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });
}

export async function sendMail({
  to, subject, html, text,
}: { to: string; subject: string; html: string; text?: string }) {
  if (process.env.ENABLE_EMAIL_NOTIFICATIONS !== "true") return { skipped: true };

  return createMailer().sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject,
    text: text ?? html.replace(/<[^>]+>/g, " "),
    html,
  });
}

export function contactEmail(d: any) {
  return `<h2>New Nexora contact submission</h2>
    <p><b>Name:</b> ${d.name}</p>
    <p><b>Email:</b> ${d.email}</p>
    <p><b>Company:</b> ${d.company ?? "-"}</p>
    <p><b>Subject:</b> ${d.subject}</p>
    <div style="background:#f4f4f7;padding:16px;border-radius:12px">${d.message}</div>`;
}
