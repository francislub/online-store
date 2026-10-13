// app/api/contact/route.js
// Route: /api/contact  (POST, public)
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { esc, sendMail } from "@/lib/mailer";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const b = await request.json().catch(() => ({}));
    if (b.website) return NextResponse.json({ message: "Message sent" }); // honeypot: bots fill this

    const name = String(b.name || "").trim();
    const email = String(b.email || "").trim();
    const phone = String(b.phone || "").trim();
    const subject = String(b.subject || "").trim();
    const message = String(b.message || "").trim();

    if (!name || !subject || message.length < 5 || !/^\S+@\S+\.\S+$/.test(email))
      return NextResponse.json({ message: "Please fill in all required fields" }, { status: 400 });
    if (message.length > 3000) return NextResponse.json({ message: "Message is too long" }, { status: 400 });

    await db.notification.create({
      data: {
        userId: null,
        title: `Contact: ${subject.slice(0, 120)}`,
        message: `${name} <${email}>${phone ? ` · ${phone}` : ""}\n\n${message}`,
        type: "CONTACT",
      },
    });

    await sendMail({
      to: process.env.STORE_NOTIFY_EMAIL,
      replyTo: email,
      subject: `Website message: ${subject}`,
      html: `<p><b>${esc(name)}</b> (${esc(email)}${phone ? `, ${esc(phone)}` : ""})</p>
             <pre style="white-space:pre-wrap;font-family:inherit">${esc(message)}</pre>`,
    });

    return NextResponse.json({ message: "Message sent" }, { status: 201 });
  } catch (err) {
    console.error("[api/contact]", err?.message || err);
    return NextResponse.json({ message: "Failed to send message" }, { status: 500 });
  }
}