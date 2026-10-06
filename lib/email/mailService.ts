import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type SendEmailResult = {
  ok: boolean;
  error?: string;
};

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  const host = process.env.SMTP_HOST?.trim();
  if (!host) {
    throw new Error("SMTP_HOST is not configured");
  }

  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASSWORD ?? "";

    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user ? { user, pass } : undefined,
    });
  }

  return transporter;
}

function getFromAddress(): string {
  const fromEmail = process.env.SMTP_FROM_EMAIL?.trim() || process.env.SMTP_USER?.trim();
  const fromName = process.env.SMTP_FROM_NAME?.trim() || "AASA Performance Management";
  if (!fromEmail) {
    throw new Error("SMTP_FROM_EMAIL is not configured");
  }
  return `"${fromName.replace(/"/g, "")}" <${fromEmail}>`;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  try {
    const to = input.to?.trim();
    if (!to) {
      const error = "Recipient email address is missing";
      console.error(`[email] ${error}`);
      return { ok: false, error };
    }

    const info = await getTransporter().sendMail({
      from: getFromAddress(),
      to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });

    console.log(`[email] Sent "${input.subject}" to ${to} (id: ${info.messageId || "n/a"})`);
    return { ok: true };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error(`[email] Failed to send "${input.subject}" to ${input.to}:`, err);
    return { ok: false, error };
  }
}
