// Route: /dashboard/invoices/[id]
// File: src/app/(backoffice)/dashboard/invoices/[id]/page.jsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Banknote, CheckCircle2, Pencil, Printer, Send, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import InvoiceDocument from "@/components/backoffice/InvoiceDocument";
import StatusBadge from "@/components/backoffice/StatusBadge";
import { makeGetRequest } from "@/lib/apiRequest";
import { money } from "@/lib/invoiceFormat";

export default function InvoiceDetails() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const loadInvoice = useCallback(async () => {
    const data = await makeGetRequest(`/api/invoices/${id}`);
    setInvoice(data);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    if (id) loadInvoice();
  }, [id, loadInvoice]);

  async function changeStatus(status, confirmText) {
    if (confirmText && !window.confirm(confirmText)) return;
    setUpdating(true);
    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const result = await response.json().catch(() => null);
      if (response.ok) {
        toast.success(`Invoice marked as ${status.toLowerCase()}`);
        await loadInvoice();
      } else {
        toast.error(result?.message || "Something Went wrong");
      }
    } catch (error) {
      console.log(error);
      toast.error("Network error, please try again");
    } finally {
      setUpdating(false);
    }
  }

  // The browser uses the page title as the default PDF file name,
  // so we temporarily set it to the invoice number while printing.
  function handlePrint() {
    const previous = document.title;
    document.title = `${invoice.number}${invoice.customerName ? ` - ${invoice.customerName}` : ""}`;
    const restore = () => {
      document.title = previous;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    window.print();
  }

  if (loading) return <p className="p-6 text-center">Loading invoice...</p>;
  if (!invoice) return <p className="p-6 text-center">Invoice not found</p>;

  const canEdit = ["DRAFT", "ISSUED", "SENT", "OVERDUE"].includes(invoice.status);
  const open = !["PAID", "VOID"].includes(invoice.status);
  const btn =
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div>
      {/* Toolbar (hidden when printing because only .print-area is visible) */}
      <div className="mb-6 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard/invoices"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:underline dark:text-slate-200"
            >
              <ArrowLeft className="h-4 w-4" /> Back to invoices
            </Link>
            <span className="hidden h-5 w-px bg-slate-200 md:block dark:bg-slate-600" />
            <span className="text-sm font-semibold text-slate-900 dark:text-white">{invoice.number}</span>
            <StatusBadge value={invoice.status} />
            {invoice.balance > 0 && invoice.status !== "VOID" && (
              <span className="text-xs text-slate-500">Balance {money(invoice.balance)}</span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {invoice.status === "DRAFT" && (
              <button
                type="button"
                disabled={updating}
                onClick={() => changeStatus("ISSUED")}
                className={`${btn} border border-blue-600 text-blue-700 hover:bg-blue-50 focus:ring-blue-300 dark:text-blue-400 dark:hover:bg-blue-500/10`}
              >
                <CheckCircle2 className="h-4 w-4" /> Issue Invoice
              </button>
            )}
            {["ISSUED", "OVERDUE"].includes(invoice.status) && (
              <button
                type="button"
                disabled={updating}
                onClick={() => changeStatus("SENT")}
                className={`${btn} border border-indigo-600 text-indigo-700 hover:bg-indigo-50 focus:ring-indigo-300 dark:text-indigo-400 dark:hover:bg-indigo-500/10`}
              >
                <Send className="h-4 w-4" /> Mark Sent
              </button>
            )}
            {open && (
              <button
                type="button"
                disabled={updating}
                onClick={() => changeStatus("PAID", "Mark this invoice as fully paid?")}
                className={`${btn} bg-lime-600 text-white hover:bg-lime-700 focus:ring-lime-300 dark:focus:ring-lime-800`}
              >
                <Banknote className="h-4 w-4" /> Mark Paid
              </button>
            )}
            {canEdit && (
              <Link
                href={`/dashboard/invoices/update/${invoice.id}`}
                className={`${btn} border border-slate-300 text-slate-700 hover:bg-slate-50 focus:ring-slate-300 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700`}
              >
                <Pencil className="h-4 w-4" /> Edit
              </Link>
            )}
            {invoice.status !== "VOID" && (
              <button
                type="button"
                disabled={updating}
                onClick={() => changeStatus("VOID", "Void this invoice? This cannot be undone.")}
                className={`${btn} border border-red-600 text-red-700 hover:bg-red-50 focus:ring-red-300 dark:text-red-400 dark:hover:bg-red-500/10`}
              >
                <XCircle className="h-4 w-4" /> Void
              </button>
            )}
            <button
              type="button"
              onClick={handlePrint}
              className={`${btn} bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-300 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white`}
            >
              <Printer className="h-4 w-4" /> Print / Save PDF
            </button>
          </div>
        </div>
      </div>

      {/* A4 sheet: always white, even in dark theme, so it prints correctly */}
      <div className="overflow-x-auto pb-6">
        <InvoiceDocument invoice={invoice} />
      </div>
    </div>
  );
}
