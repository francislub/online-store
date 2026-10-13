// src/components/frontend/ContactForm.jsx
// Route: /contact
"use client";

import React, { useState } from "react";
import { CheckCircle2 } from "lucide-react";

const inputCls =
  "w-full rounded-md border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

const EMPTY = { name: "", email: "", phone: "", subject: "", message: "", website: "" };

export default function ContactForm() {
  const [form, setForm] = useState(EMPTY);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.message || "Something went wrong. Please try again.");
        return;
      }
      setSent(true);
      setForm(EMPTY);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center rounded-xl bg-white p-10 text-center shadow-sm">
        <CheckCircle2 size={48} className="text-green-600" />
        <h3 className="mt-4 text-xl font-semibold text-gray-900">Message sent</h3>
        <p className="mt-2 text-gray-500">Thanks for reaching out. We will get back to you shortly.</p>
        <button
          onClick={() => setSent(false)}
          className="mt-6 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
      {/* honeypot: hidden from people, bots fill it */}
      <input name="website" value={form.website} onChange={onChange} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-700">Full name</label>
          <input id="name" name="name" required value={form.name} onChange={onChange} className={inputCls} />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
          <input id="email" name="email" type="email" required value={form.email} onChange={onChange} className={inputCls} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-gray-700">Phone</label>
          <input id="phone" name="phone" type="tel" value={form.phone} onChange={onChange} className={inputCls} />
        </div>
        <div>
          <label htmlFor="subject" className="mb-1.5 block text-sm font-medium text-gray-700">Subject</label>
          <input id="subject" name="subject" required value={form.subject} onChange={onChange} className={inputCls} />
        </div>
      </div>

      <div>
        <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-gray-700">Message</label>
        <textarea id="message" name="message" rows={6} required value={form.message} onChange={onChange} className={inputCls} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={sending}
        className="rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
      >
        {sending ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}