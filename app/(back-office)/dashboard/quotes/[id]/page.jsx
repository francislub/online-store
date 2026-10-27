// Route: /dashboard/quotes/[id]
// File: src/app/(backoffice)/dashboard/quotes/[id]/page.jsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Pencil, Printer, ShoppingCart } from "lucide-react";
import PageHeader from "@/components/backoffice/PageHeader";
import StatusBadge from "@/components/backoffice/StatusBadge";
import QuoteDocument from "@/components/backoffice/QuoteDocument";
import { inputClass } from "@/components/backoffice/FormField";
import { makeGetRequest, makePostRequest, makePutRequest } from "@/lib/apiRequest";
import { prettify } from "@/lib/constants";
import { fmtDate } from "@/lib/format";

const card = "rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800";

// Quick actions that make sense from each status
const NEXT = {
  DRAFT: ["SENT", "ACCEPTED"],
  SENT: ["ACCEPTED", "REJECTED"],
  ACCEPTED: [],
  REJECTED: ["DRAFT"],
  EXPIRED: ["DRAFT"],
  CONVERTED: [],
};

export default function QuoteDetails() {
  const { id } = useParams();
  const router = useRouter();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showConvert, setShowConvert] = useState(false);
  const [form, setForm] = useState({ phone: "", address: "", dueAt: "", createInvoice: true });

  const load = useCallback(async () => {
    const data = await makeGetRequest(`/api/quotes/${id}`);
    setQuote(data);
    if (data?.customer?.phone) setForm((f) => ({ ...f, phone: f.phone || data.customer.phone }));
    setLoading(false);
  }, [id]);

  useEffect(() => {
    if (id) load();
  }, [id, load]);

  if (loading) return <p className="p-6 text-center">Loading quote...</p>;
  if (!quote) return <p className="p-6 text-center">Quote not found</p>;

  const converted = quote.status === "CONVERTED";
  const closed = converted || quote.status === "REJECTED" || quote.status === "EXPIRED";

  async function changeStatus(status) {
    const result = await makePutRequest(setBusy, `/api/quotes/${id}`, { status }, "Quote");
    if (result) load();
  }

  async function convert(e) {
    e.preventDefault();
    const result = await makePostRequest(
      setBusy,
      `/api/quotes/${id}/convert`,
      { phone: form.phone, address: form.address, dueAt: form.dueAt || null, createInvoice: form.createInvoice },
      "Order",
      null,
      null
    );
    if (result?.data?.id) router.push(`/dashboard/orders/${result.data.id}`);
  }

  return (
    <div>
      <div className="print:hidden">
        <PageHeader heading={`Quote ${quote.number}`} href="/dashboard/quotes/new" linkTitle="New Quote" />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 print:hidden">
        <StatusBadge value={quote.status} />
        <span className="text-sm text-gray-500">
          Created {fmtDate(quote.createdAt)} by {quote.createdBy?.name ?? "-"}
          {quote.validUntil && ` • Valid until ${fmtDate(quote.validUntil)}`}
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Printer className="h-4 w-4" /> Print
          </button>
          {!converted && (
            <Link href={`/dashboard/quotes/update/${quote.id}`} className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Pencil className="h-4 w-4" /> Edit
            </Link>
          )}
          {!closed && (
            <button type="button" onClick={() => setShowConvert((v) => !v)} className="inline-flex items-center gap-1 rounded-lg bg-lime-600 px-4 py-2 text-sm font-medium text-white hover:bg-lime-700">
              <ShoppingCart className="h-4 w-4" /> Convert to order
            </button>
          )}
        </div>
      </div>

      {NEXT[quote.status].length > 0 && (
        <div className={`${card} mt-4 flex flex-wrap items-center gap-2 print:hidden`}>
          <span className="mr-2 text-sm font-medium text-gray-900 dark:text-white">Mark quote as:</span>
          {NEXT[quote.status].map((s) => (
            <button key={s} type="button" disabled={busy} onClick={() => changeStatus(s)} className="rounded-full bg-lime-50 px-4 py-1.5 text-xs font-medium capitalize text-lime-800 ring-1 ring-lime-200 hover:bg-lime-100 disabled:opacity-60">
              {prettify(s)}
            </button>
          ))}
        </div>
      )}

      {showConvert && !closed && (
        <form onSubmit={convert} className={`${card} mt-4 print:hidden`}>
          <h3 className="mb-1 text-base font-semibold text-gray-900 dark:text-white">Convert to order</h3>
          <p className="mb-4 text-xs text-gray-500">
            Stock is deducted at the quoted prices and an invoice is issued. Leave phone/address empty to use the customer's saved details.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <input className={inputClass} placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <input className={inputClass} placeholder="Delivery address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <label className="text-xs text-gray-600">
              Invoice due date
              <input type="date" className={`${inputClass} mt-1`} value={form.dueAt} onChange={(e) => setForm({ ...form, dueAt: e.target.value })} />
            </label>
            <label className="flex items-center gap-2 pt-5 text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" checked={form.createInvoice} onChange={(e) => setForm({ ...form, createInvoice: e.target.checked })} /> Issue invoice
            </label>
          </div>
          <button type="submit" disabled={busy} className="mt-4 rounded-lg bg-lime-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-lime-700 disabled:opacity-60">
            {busy ? "Converting please wait..." : "Create order from quote"}
          </button>
        </form>
      )}

      {/* A4 quotation sheet: same layout as the invoice, and the only thing that prints */}
      <div className="mt-4 overflow-x-auto pb-4 print:mt-0 print:overflow-visible print:pb-0">
        <QuoteDocument quote={quote} />
      </div>
    </div>
  );
}