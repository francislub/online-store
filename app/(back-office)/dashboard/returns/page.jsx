// Route: /dashboard/returns
// File: src/app/(backoffice)/dashboard/returns/page.jsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Pencil, Trash2 } from "lucide-react";
import PageHeader from "@/components/backoffice/PageHeader";
import TableActions from "@/components/backoffice/TableActions";
import StatusBadge from "@/components/backoffice/StatusBadge";
import { makeDeleteRequest, makeGetRequest } from "@/lib/apiRequest";
import { RETURN_STATUSES } from "@/lib/constants";
import { downloadCsv } from "@/lib/csv";
import { fmtDate, money } from "@/lib/format";

const STATUSES = ["ALL", ...RETURN_STATUSES];
const customerOf = (r) => r.order?.customer?.name ?? r.order?.invoice?.customerName ?? "Walk-in";

export default function Returns() {
  const [returns, setReturns] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadReturns = useCallback(async () => {
    setLoading(true);
    const query = new URLSearchParams({ search });
    if (status !== "ALL") query.set("status", status);
    if (from) query.set("from", from);
    if (to) query.set("to", to);
    const data = await makeGetRequest(`/api/returns?${query.toString()}`);
    setReturns(Array.isArray(data) ? data : []);
    setSelected([]);
    setLoading(false);
  }, [search, status, from, to]);

  useEffect(() => {
    loadReturns();
  }, [loadReturns]);

  const stats = useMemo(
    () => ({
      needAction: returns.filter((r) => ["REQUESTED", "APPROVED", "RECEIVED"].includes(r.status)).length,
      awaitingRefund: returns.filter((r) => r.status === "RECEIVED").reduce((sum, r) => sum + r.refundAmount, 0),
      refunded: returns.filter((r) => r.status === "REFUNDED").reduce((sum, r) => sum + r.refundAmount, 0),
    }),
    [returns]
  );

  const allSelected = returns.length > 0 && selected.length === returns.length;
  const toggleAll = () => setSelected(allSelected ? [] : returns.map((r) => r.id));
  const toggleOne = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  async function handleDelete(item) {
    if (!window.confirm(`Delete return ${item.reference}?`)) return;
    const result = await makeDeleteRequest(setDeleting, `/api/returns/${item.id}`, null, "Return deleted");
    if (result) loadReturns();
  }

  async function handleBulkDelete() {
    if (!window.confirm(`Delete ${selected.length} selected return(s)? Processed returns are kept.`)) return;
    const result = await makeDeleteRequest(setDeleting, "/api/returns", { ids: selected });
    if (result) loadReturns();
  }

  function handleExport() {
    setExporting(true);
    try {
      downloadCsv(
        "returns.csv",
        ["Date", "Reference", "Order", "Customer", "Reason", "Items", "Refund", "Status"],
        returns.map((r) => [
          fmtDate(r.createdAt),
          r.reference,
          r.order?.orderNumber ?? "",
          customerOf(r),
          r.reason,
          r.items.map((i) => `${i.product?.name ?? "Item"} x${i.quantity}`).join("; "),
          r.refundAmount,
          r.status,
        ])
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
      <PageHeader heading="Returns" href="/dashboard/returns/new" linkTitle="New Return" />

      <TableActions
        placeholder="Search by reference, order no, customer or reason"
        onSearch={setSearch}
        onExport={handleExport}
        onBulkDelete={handleBulkDelete}
        selectedCount={selected.length}
        exporting={exporting}
        deleting={deleting}
      />

      <div className="mt-4 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium capitalize transition-colors ${
              status === s
                ? "bg-lime-600 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700"
            }`}
          >
            {s.toLowerCase()}
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
            <div className="text-xs text-gray-500">Open returns</div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">{stats.needAction}</div>
          </div>
          <div className={tile}>
            <div className="text-xs text-gray-500">Received, awaiting refund</div>
            <div className="text-lg font-bold text-amber-600">{money(stats.awaitingRefund)}</div>
          </div>
          <div className={tile}>
            <div className="text-xs text-gray-500">Refunded</div>
            <div className="text-lg font-bold text-red-600">{money(stats.refunded)}</div>
          </div>
        </div>
      </div>

      <div className="relative mt-4 overflow-x-auto rounded-lg shadow-md">
        <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
          <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th className="p-4">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              </th>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Return</th>
              <th className="px-6 py-3">Order</th>
              <th className="px-6 py-3">Customer</th>
              <th className="px-6 py-3">Refund</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center">Loading...</td>
              </tr>
            ) : returns.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center">No returns found</td>
              </tr>
            ) : (
              returns.map((item) => (
                <tr key={item.id} className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-600">
                  <td className="p-4">
                    <input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggleOne(item.id)} />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">{fmtDate(item.createdAt)}</td>
                  <td className="px-6 py-4">
                    <Link href={`/dashboard/returns/${item.id}`} className="font-medium text-gray-900 hover:underline dark:text-white">
                      {item.reference}
                    </Link>
                    <div className="max-w-xs truncate text-xs">{item.reason}</div>
                  </td>
                  <td className="px-6 py-4">
                    {item.order ? (
                      <Link href={`/dashboard/orders/${item.order.id}`} className="text-blue-600 hover:underline">
                        {item.order.orderNumber}
                      </Link>
                    ) : (
                      "-"
                    )}
                    <div className="text-xs">{item.items.length} item(s)</div>
                  </td>
                  <td className="px-6 py-4">{customerOf(item)}</td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{money(item.refundAmount)}</td>
                  <td className="px-6 py-4">
                    <StatusBadge value={item.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <Link href={`/dashboard/returns/${item.id}`} className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline">
                        <Eye className="h-4 w-4" /> View
                      </Link>
                      {["REQUESTED", "APPROVED"].includes(item.status) && (
                        <Link href={`/dashboard/returns/update/${item.id}`} className="inline-flex items-center gap-1 font-medium text-lime-600 hover:underline">
                          <Pencil className="h-4 w-4" /> Edit
                        </Link>
                      )}
                      {["REQUESTED", "REJECTED"].includes(item.status) && (
                        <button type="button" onClick={() => handleDelete(item)} className="inline-flex items-center gap-1 font-medium text-red-600 hover:underline">
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
