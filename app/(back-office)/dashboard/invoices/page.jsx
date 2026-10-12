// Route: /dashboard/invoices
// File: src/app/(backoffice)/dashboard/invoices/page.jsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Pencil, Trash2 } from "lucide-react";
import PageHeader from "@/components/backoffice/PageHeader";
import TableActions from "@/components/backoffice/TableActions";
import StatusBadge from "@/components/backoffice/StatusBadge";
import { makeDeleteRequest, makeGetRequest } from "@/lib/apiRequest";
import { fmtDate, money } from "@/lib/invoiceFormat";

const FILTERS = ["ALL", "DRAFT", "ISSUED", "SENT", "PAID", "OVERDUE", "VOID"];

function StatCard({ label, value, tone = "slate" }) {
  const tones = {
    slate: "text-slate-900 dark:text-white",
    amber: "text-amber-600",
    red: "text-red-600",
    lime: "text-lime-600",
  };
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-bold ${tones[tone]}`}>{value}</p>
    </div>
  );
}

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    const query = new URLSearchParams({ search });
    if (status !== "ALL") query.set("status", status);
    const data = await makeGetRequest(`/api/invoices?${query.toString()}`);
    setInvoices(Array.isArray(data) ? data : []);
    setSelected([]);
    setLoading(false);
  }, [search, status]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const allSelected = invoices.length > 0 && selected.length === invoices.length;
  const canDelete = (i) => ["DRAFT", "VOID"].includes(i.status);
  const canEdit = (i) => ["DRAFT", "ISSUED", "SENT", "OVERDUE"].includes(i.status);

  // Summary of what is currently listed (ignores void invoices)
  const live = invoices.filter((i) => i.status !== "VOID");
  const invoiced = live.reduce((s, i) => s + i.total, 0);
  const collected = live.reduce((s, i) => s + i.amountPaid, 0);
  const outstanding = live.reduce((s, i) => s + i.balance, 0);
  const overdueCount = invoices.filter((i) => i.status === "OVERDUE").length;

  function toggleAll() {
    setSelected(allSelected ? [] : invoices.map((i) => i.id));
  }

  function toggleOne(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleDelete(invoice) {
    if (!window.confirm(`Delete invoice "${invoice.number}"?`)) return;
    const result = await makeDeleteRequest(setDeleting, `/api/invoices/${invoice.id}`, null, "Invoice deleted");
    if (result) loadInvoices();
  }

  async function handleBulkDelete() {
    if (!window.confirm(`Delete ${selected.length} selected invoice(s)?`)) return;
    const result = await makeDeleteRequest(setDeleting, "/api/invoices", { ids: selected });
    if (result) loadInvoices();
  }

  function handleExport() {
    setExporting(true);
    try {
      const header = [
        "Invoice No", "Customer", "Phone", "Order", "Items", "Date", "Due", "Total", "Paid", "Balance", "Status",
      ];
      const rows = invoices.map((i) => [
        i.number,
        i.customerName ?? "",
        i.customerPhone ?? "",
        i.order?.orderNumber ?? "",
        i._count?.items ?? "",
        fmtDate(i.issuedAt),
        fmtDate(i.dueAt),
        i.total,
        i.amountPaid,
        i.balance,
        i.status,
      ]);
      const csv = [header, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        .join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "invoices.csv";
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <PageHeader heading="Invoices" href="/dashboard/invoices/new" linkTitle="New Invoice" />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Invoiced" value={money(invoiced)} />
        <StatCard label="Collected" value={money(collected)} tone="lime" />
        <StatCard label="Outstanding" value={money(outstanding)} tone="amber" />
        <StatCard label="Overdue invoices" value={overdueCount} tone={overdueCount ? "red" : "slate"} />
      </div>

      <TableActions
        placeholder="Search by invoice no, customer, phone or order"
        onSearch={setSearch}
        onExport={handleExport}
        onBulkDelete={handleBulkDelete}
        selectedCount={selected.length}
        exporting={exporting}
        deleting={deleting}
      />

      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setStatus(f)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium capitalize transition-colors ${
              status === f
                ? "bg-lime-600 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700"
            }`}
          >
            {f.toLowerCase()}
          </button>
        ))}
      </div>

      <div className="relative mt-4 overflow-x-auto rounded-lg shadow-md">
        <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
          <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th className="p-4">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              </th>
              <th className="px-6 py-3">Invoice No</th>
              <th className="px-6 py-3">Customer</th>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Total</th>
              <th className="px-6 py-3">Balance</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center">Loading...</td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center">No invoices found</td>
              </tr>
            ) : (
              invoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-600"
                >
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selected.includes(invoice.id)}
                      onChange={() => toggleOne(invoice.id)}
                    />
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    {invoice.number}
                    <div className="text-xs font-normal">
                      {invoice.order?.orderNumber ? `Order ${invoice.order.orderNumber}` : "Direct invoice"}
                      {" • "}
                      {invoice._count?.items ?? 0} item(s)
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {invoice.customerName ?? "-"}
                    {invoice.customerPhone && <div className="text-xs">{invoice.customerPhone}</div>}
                  </td>
                  <td className="px-6 py-4">{fmtDate(invoice.issuedAt)}</td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{money(invoice.total)}</td>
                  <td className="px-6 py-4">{money(invoice.balance)}</td>
                  <td className="px-6 py-4">
                    <StatusBadge value={invoice.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/dashboard/invoices/${invoice.id}`}
                        className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline"
                      >
                        <Eye className="h-4 w-4" /> View
                      </Link>
                      {canEdit(invoice) && (
                        <Link
                          href={`/dashboard/invoices/update/${invoice.id}`}
                          className="inline-flex items-center gap-1 font-medium text-lime-600 hover:underline"
                        >
                          <Pencil className="h-4 w-4" /> Edit
                        </Link>
                      )}
                      {canDelete(invoice) && (
                        <button
                          type="button"
                          onClick={() => handleDelete(invoice)}
                          className="inline-flex items-center gap-1 font-medium text-red-600 hover:underline"
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </button>
                      )}
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
