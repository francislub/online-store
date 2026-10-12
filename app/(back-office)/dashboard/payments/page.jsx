// Route: /dashboard/payments
// File: src/app/(backoffice)/dashboard/payments/page.jsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import PageHeader from "@/components/backoffice/PageHeader";
import TableActions from "@/components/backoffice/TableActions";
import StatusBadge from "@/components/backoffice/StatusBadge";
import { makeDeleteRequest, makeGetRequest } from "@/lib/apiRequest";
import { COUNTED_PAYMENT_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES, prettify } from "@/lib/constants";
import { downloadCsv } from "@/lib/csv";
import { fmtDate, money } from "@/lib/format";

const STATUSES = ["ALL", ...PAYMENT_STATUSES];
const METHODS = ["ALL", ...PAYMENT_METHODS];
const chip = (active) =>
  `rounded-full px-4 py-1.5 text-xs font-medium capitalize transition-colors ${
    active
      ? "bg-lime-600 text-white"
      : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700"
  }`;

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [method, setMethod] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    const query = new URLSearchParams({ search });
    if (status !== "ALL") query.set("status", status);
    if (method !== "ALL") query.set("method", method);
    if (from) query.set("from", from);
    if (to) query.set("to", to);
    const data = await makeGetRequest(`/api/payments?${query.toString()}`);
    setPayments(Array.isArray(data) ? data : []);
    setSelected([]);
    setLoading(false);
  }, [search, status, method, from, to]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  // only PAID / PARTIAL count as money received; split by method for end-of-day cash-up
  const stats = useMemo(() => {
    const received = payments.filter((p) => COUNTED_PAYMENT_STATUSES.includes(p.status));
    const byMethod = {};
    received.forEach((p) => {
      byMethod[p.method] = (byMethod[p.method] ?? 0) + p.amount;
    });
    return {
      received: received.reduce((sum, p) => sum + p.amount, 0),
      pending: payments.filter((p) => p.status === "PENDING").reduce((sum, p) => sum + p.amount, 0),
      refunded: payments.filter((p) => p.status === "REFUNDED").reduce((sum, p) => sum + p.amount, 0),
      byMethod,
    };
  }, [payments]);

  const allSelected = payments.length > 0 && selected.length === payments.length;
  const toggleAll = () => setSelected(allSelected ? [] : payments.map((p) => p.id));
  const toggleOne = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  async function handleDelete(payment) {
    if (!window.confirm(`Delete payment ${payment.reference}? The invoice balance will be recalculated.`)) return;
    const result = await makeDeleteRequest(setDeleting, `/api/payments/${payment.id}`, null, "Payment deleted");
    if (result) loadPayments();
  }

  async function handleBulkDelete() {
    if (!window.confirm(`Delete ${selected.length} selected payment(s)?`)) return;
    const result = await makeDeleteRequest(setDeleting, "/api/payments", { ids: selected });
    if (result) loadPayments();
  }

  function handleExport() {
    setExporting(true);
    try {
      downloadCsv(
        "payments.csv",
        ["Date", "Reference", "Order", "Customer", "Method", "Status", "Amount", "Recorded By", "Notes"],
        payments.map((p) => [fmtDate(p.paidAt), p.reference, p.order?.orderNumber ?? "", p.customer?.name ?? "", p.method, p.status, p.amount, p.recordedBy?.name ?? "", p.notes ?? ""])
      );
    } finally {
      setExporting(false);
    }
  }

  const dateInput =
    "rounded-lg border border-gray-300 bg-gray-50 p-2 text-sm text-gray-900 focus:border-lime-500 focus:ring-lime-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white";
  const tile = "rounded-lg bg-white px-5 py-3 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700";

  return (
    <div>
      <PageHeader heading="Payments" href="/dashboard/payments/new" linkTitle="Record Payment" />

      <TableActions
        placeholder="Search by reference, order no, customer or notes"
        onSearch={setSearch}
        onExport={handleExport}
        onBulkDelete={handleBulkDelete}
        selectedCount={selected.length}
        exporting={exporting}
        deleting={deleting}
      />

      <div className="mt-4 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button key={s} type="button" onClick={() => setStatus(s)} className={chip(status === s)}>
            {s.toLowerCase()}
          </button>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {METHODS.map((m) => (
          <button key={m} type="button" onClick={() => setMethod(m)} className={chip(method === m)}>
            {prettify(m)}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs text-gray-600 dark:text-gray-400">
            From
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={`${dateInput} mt-1 block`} />
          </label>
          <label className="text-xs text-gray-600 dark:text-gray-400">
            To
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={`${dateInput} mt-1 block`} />
          </label>
          {(from || to) && (
            <button
              type="button"
              onClick={() => {
                setFrom("");
                setTo("");
              }}
              className="pb-2 text-sm font-medium text-lime-700 hover:underline"
            >
              Clear dates
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-3 text-right">
          <div className={tile}>
            <div className="text-xs text-gray-500">Received ({payments.length} payments)</div>
            <div className="text-lg font-bold text-lime-700">{money(stats.received)}</div>
          </div>
          <div className={tile}>
            <div className="text-xs text-gray-500">Pending</div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">{money(stats.pending)}</div>
          </div>
          <div className={tile}>
            <div className="text-xs text-gray-500">Refunded</div>
            <div className="text-lg font-bold text-red-600">{money(stats.refunded)}</div>
          </div>
        </div>
      </div>

      {Object.keys(stats.byMethod).length > 0 && (
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
          {Object.entries(stats.byMethod).map(([m, amount]) => (
            <span key={m}>
              <span className="capitalize">{prettify(m)}</span>: <span className="font-semibold text-gray-900 dark:text-white">{money(amount)}</span>
            </span>
          ))}
        </div>
      )}

      <div className="relative mt-4 overflow-x-auto rounded-lg shadow-md">
        <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
          <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th className="p-4">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              </th>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Reference</th>
              <th className="px-6 py-3">Order</th>
              <th className="px-6 py-3">Customer</th>
              <th className="px-6 py-3">Method</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Amount</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="px-6 py-8 text-center">Loading...</td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-8 text-center">No payments found</td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment.id} className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-600">
                  <td className="p-4">
                    <input type="checkbox" checked={selected.includes(payment.id)} onChange={() => toggleOne(payment.id)} />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">{fmtDate(payment.paidAt)}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 dark:text-white">{payment.reference}</div>
                    <div className="text-xs">by {payment.recordedBy?.name ?? "-"}</div>
                  </td>
                  <td className="px-6 py-4">
                    {payment.order ? (
                      <Link href={`/dashboard/orders/${payment.order.id}`} className="text-blue-600 hover:underline">
                        {payment.order.orderNumber}
                      </Link>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-6 py-4">{payment.customer?.name ?? "-"}</td>
                  <td className="px-6 py-4 capitalize">{prettify(payment.method)}</td>
                  <td className="px-6 py-4">
                    <StatusBadge value={payment.status} />
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{money(payment.amount)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <Link href={`/dashboard/payments/update/${payment.id}`} className="inline-flex items-center gap-1 font-medium text-lime-600 hover:underline">
                        <Pencil className="h-4 w-4" /> Edit
                      </Link>
                      <button type="button" onClick={() => handleDelete(payment)} className="inline-flex items-center gap-1 font-medium text-red-600 hover:underline">
                        <Trash2 className="h-4 w-4" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
