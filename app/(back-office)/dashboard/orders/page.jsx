// Route: /dashboard/orders
// File: src/app/(backoffice)/dashboard/orders/page.jsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, FileText, Pencil, Trash2 } from "lucide-react";
import PageHeader from "@/components/backoffice/PageHeader";
import TableActions from "@/components/backoffice/TableActions";
import StatusBadge from "@/components/backoffice/StatusBadge";
import { makeDeleteRequest, makeGetRequest } from "@/lib/apiRequest";
import { ORDER_STATUSES } from "@/lib/constants";
import { downloadCsv } from "@/lib/csv";
import { fmtDate, money } from "@/lib/format";

const STATUSES = ["ALL", ...ORDER_STATUSES];
const customerOf = (o) => o.customer?.name ?? o.invoice?.customerName ?? "Walk-in";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    const query = new URLSearchParams({ search });
    if (status !== "ALL") query.set("status", status);
    if (from) query.set("from", from);
    if (to) query.set("to", to);
    const data = await makeGetRequest(`/api/orders?${query.toString()}`);
    setOrders(Array.isArray(data) ? data : []);
    setSelected([]);
    setLoading(false);
  }, [search, status, from, to]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // cancelled orders don't count as sales
  const stats = useMemo(() => {
    const live = orders.filter((o) => o.status !== "CANCELLED");
    return {
      count: orders.length,
      sales: live.reduce((sum, o) => sum + o.total, 0),
      collected: live.reduce((sum, o) => sum + (o.invoice?.amountPaid ?? 0), 0),
      outstanding: live.reduce((sum, o) => sum + (o.invoice?.balance ?? 0), 0),
    };
  }, [orders]);

  const allSelected = orders.length > 0 && selected.length === orders.length;
  const toggleAll = () => setSelected(allSelected ? [] : orders.map((o) => o.id));
  const toggleOne = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  async function handleDelete(order) {
    if (!window.confirm(`Delete order ${order.orderNumber}? Stock will be put back.`)) return;
    const result = await makeDeleteRequest(setDeleting, `/api/orders/${order.id}`, null, "Order deleted");
    if (result) loadOrders();
  }

  async function handleBulkDelete() {
    if (!window.confirm(`Delete ${selected.length} selected order(s)? Orders with payments or returns are skipped.`)) return;
    const result = await makeDeleteRequest(setDeleting, "/api/orders", { ids: selected });
    if (result) loadOrders();
  }

  function handleExport() {
    setExporting(true);
    try {
      downloadCsv(
        "orders.csv",
        ["Date", "Order No", "Customer", "Phone", "Status", "Total", "Paid", "Balance"],
        orders.map((o) => [fmtDate(o.createdAt), o.orderNumber, customerOf(o), o.phone, o.status, o.total, o.invoice?.amountPaid ?? 0, o.invoice?.balance ?? ""])
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
      <PageHeader heading="Orders" href="/dashboard/orders/new" linkTitle="New Order" />

      <TableActions
        placeholder="Search by order no, customer, phone or invoice no"
        onSearch={setSearch}
        onExport={handleExport}
        onBulkDelete={handleBulkDelete}
        selectedCount={selected.length}
        exporting={exporting}
        deleting={deleting}
      />

      {/* Status filter */}
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

      {/* Date range + summary */}
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
            <div className="text-xs text-gray-500">Sales ({stats.count} orders)</div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">{money(stats.sales)}</div>
          </div>
          <div className={tile}>
            <div className="text-xs text-gray-500">Collected</div>
            <div className="text-lg font-bold text-lime-700">{money(stats.collected)}</div>
          </div>
          <div className={tile}>
            <div className="text-xs text-gray-500">Outstanding</div>
            <div className="text-lg font-bold text-red-600">{money(stats.outstanding)}</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="relative mt-4 overflow-x-auto rounded-lg shadow-md">
        <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
          <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th className="p-4">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              </th>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Order</th>
              <th className="px-6 py-3">Customer</th>
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
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center">No orders found</td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-600">
                  <td className="p-4">
                    <input type="checkbox" checked={selected.includes(order.id)} onChange={() => toggleOne(order.id)} />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">{fmtDate(order.createdAt)}</td>
                  <td className="px-6 py-4">
                    <Link href={`/dashboard/orders/${order.id}`} className="font-medium text-gray-900 hover:underline dark:text-white">
                      {order.orderNumber}
                    </Link>
                    <div className="text-xs">{order._count?.items ?? 0} item(s)</div>
                  </td>
                  <td className="px-6 py-4">
                    <div>{customerOf(order)}</div>
                    <div className="text-xs">{order.phone}</div>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{money(order.total)}</td>
                  <td className="px-6 py-4">
                    {order.invoice ? (
                      <span className={order.invoice.balance > 0 ? "font-medium text-red-600" : "font-medium text-lime-700"}>
                        {order.invoice.balance > 0 ? money(order.invoice.balance) : "Paid"}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge value={order.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <Link href={`/dashboard/orders/${order.id}`} className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline">
                        <Eye className="h-4 w-4" /> View
                      </Link>
                      {order.invoice && (
                        <Link href={`/dashboard/invoices/${order.invoice.id}`} className="inline-flex items-center gap-1 font-medium text-gray-600 hover:underline">
                          <FileText className="h-4 w-4" /> Invoice
                        </Link>
                      )}
                      {order.status !== "CANCELLED" && (
                        <Link href={`/dashboard/orders/update/${order.id}`} className="inline-flex items-center gap-1 font-medium text-lime-600 hover:underline">
                          <Pencil className="h-4 w-4" /> Edit
                        </Link>
                      )}
                      <button type="button" onClick={() => handleDelete(order)} className="inline-flex items-center gap-1 font-medium text-red-600 hover:underline">
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
