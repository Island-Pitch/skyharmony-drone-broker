import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || '587');
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || 'noreply@skyharmony.net';

let transporter: nodemailer.Transporter | null = null;

if (SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    ...(SMTP_USER && SMTP_PASS ? { auth: { user: SMTP_USER, pass: SMTP_PASS } } : {}),
    tls: { rejectUnauthorized: process.env.SMTP_TLS_VERIFY !== 'false' },
  });
} else {
  console.warn('[EMAIL] SMTP_HOST not set — emails will be logged but not sent');
}

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  console.log(`[EMAIL] To: ${to} | Subject: ${subject}`);

  if (!transporter) return;

  try {
    await transporter.sendMail({ from: SMTP_FROM, to, subject, html });
  } catch (err) {
    console.error('[EMAIL] Failed to send:', err);
  }
}
