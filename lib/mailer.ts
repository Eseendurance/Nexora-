import nodemailer from "nodemailer";

export function createMailer() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  if (!host || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("SMTP_HOST and a valid SMTP_PORT must be configured.");
  }

  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  if ((user && !password) || (!user && password)) {
    throw new Error("SMTP_USER and SMTP_PASSWORD must be configured together.");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "true",
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    ...(user && password ? { auth: { user, pass: password } } : {}),
  });
}

export async function sendMail({
  to, subject, html, text,
}: { to: string; subject: string; html: string; text?: string }) {
  if (process.env.ENABLE_EMAIL_NOTIFICATIONS !== "true") return { skipped: true };

  const from = process.env.MAIL_FROM ?? process.env.SMTP_USER;
  if (!from) throw new Error("MAIL_FROM or SMTP_USER must be configured to send email.");

  return createMailer().sendMail({
    from,
    to,
    subject,
    text: text ?? html.replace(/<[^>]+>/g, " "),
    html,
  });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

export function contactEmail(d: {
  name: string;
  email: string;
  company?: string;
  subject: string;
  message: string;
}) {
  const name = escapeHtml(d.name);
  const email = escapeHtml(d.email);
  const company = escapeHtml(d.company ?? "-");
  const subject = escapeHtml(d.subject);
  const message = escapeHtml(d.message).replace(/\r?\n/g, "<br>");

  return `<h2>New Nexora contact submission</h2>
    <p><b>Name:</b> ${name}</p>
    <p><b>Email:</b> ${email}</p>
    <p><b>Company:</b> ${company}</p>
    <p><b>Subject:</b> ${subject}</p>
    <div style="background:#f4f4f7;padding:16px;border-radius:12px">${message}</div>`;
}
