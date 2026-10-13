// lib/mailer.js
// Route: n/a (SMTP email helper)
import nodemailer from "nodemailer";

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST) return null;
  const port = Number(process.env.SMTP_PORT || 587);
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  return transporter;
}

export const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Never throws: email problems must not break an order.
export async function sendMail({ to, subject, html, replyTo }) {
  try {
    const t = getTransporter();
    if (!t || !to) {
      console.warn("[mailer] skipped (SMTP not configured or no recipient):", subject);
      return { skipped: true };
    }
    await t.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
      replyTo,
    });
    return { sent: true };
  } catch (err) {
    console.error("[mailer] failed:", err?.message || err);
    return { error: true };
  }
}