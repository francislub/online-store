// Route: /dashboard/purchases
// File: src/app/(backoffice)/dashboard/purchases/page.jsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Pencil, Trash2 } from "lucide-react";
import PageHeader from "@/components/backoffice/PageHeader";
import TableActions from "@/components/backoffice/TableActions";
import StatusBadge from "@/components/backoffice/StatusBadge";
import { makeDeleteRequest, makeGetRequest } from "@/lib/apiRequest";

const money = (value) => `UGX ${Number(value ?? 0).toLocaleString()}`;
const fmtDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-";

const FILTERS = ["ALL", "DRAFT", "ORDERED", "RECEIVED", "CANCELLED"];

export default function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadPurchases = useCallback(async () => {
    setLoading(true);
    const query = new URLSearchParams({ search });
    if (status !== "ALL") query.set("status", status);
    const data = await makeGetRequest(`/api/purchases?${query.toString()}`);
    setPurchases(Array.isArray(data) ? data : []);
    setSelected([]);
    setLoading(false);
  }, [search, status]);

  useEffect(() => {
    loadPurchases();
  }, [loadPurchases]);

  const allSelected = purchases.length > 0 && selected.length === purchases.length;
  const canDelete = (p) => ["DRAFT", "CANCELLED"].includes(p.status);
  const canEdit = (p) => ["DRAFT", "ORDERED"].includes(p.status);

  function toggleAll() {
    setSelected(allSelected ? [] : purchases.map((p) => p.id));
  }

  function toggleOne(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleDelete(purchase) {
    if (!window.confirm(`Delete purchase "${purchase.reference}"?`)) return;
    const result = await makeDeleteRequest(setDeleting, `/api/purchases/${purchase.id}`, null, "Purchase deleted");
    if (result) loadPurchases();
  }

  async function handleBulkDelete() {
    if (!window.confirm(`Delete ${selected.length} selected purchase(s)?`)) return;
    const result = await makeDeleteRequest(setDeleting, "/api/purchases", { ids: selected });
    if (result) loadPurchases();
  }

  function handleExport() {
    setExporting(true);
    try {
      const header = ["Reference", "Supplier", "Date", "Items", "Subtotal", "Tax", "Total", "Status"];
      const rows = purchases.map((p) => [
        p.reference,
        p.supplier?.name ?? "",
        fmtDate(p.purchasedAt),
        p._count?.items ?? 0,
        p.subtotal,
        p.tax,
        p.total,
        p.status,
      ]);
      const csv = [header, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        .join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "purchases.csv";
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <PageHeader heading="Purchases" href="/dashboard/purchases/new" linkTitle="New Purchase" />

      {/* Export, search, bulk delete */}
      <TableActions
        placeholder="Search purchases by reference or supplier"
        onSearch={setSearch}
        onExport={handleExport}
        onBulkDelete={handleBulkDelete}
        selectedCount={selected.length}
        exporting={exporting}
        deleting={deleting}
      />

      {/* Status filter */}
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

      {/* Table */}
      <div className="relative mt-4 overflow-x-auto rounded-lg shadow-md">
        <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
          <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th className="p-4">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              </th>
              <th className="px-6 py-3">Reference</th>
              <th className="px-6 py-3">Supplier</th>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Items</th>
              <th className="px-6 py-3">Total</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center">Loading...</td>
              </tr>
            ) : purchases.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center">No purchases found</td>
              </tr>
            ) : (
              purchases.map((purchase) => (
                <tr
                  key={purchase.id}
                  className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-600"
                >
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selected.includes(purchase.id)}
                      onChange={() => toggleOne(purchase.id)}
                    />
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{purchase.reference}</td>
                  <td className="px-6 py-4">{purchase.supplier?.name ?? "-"}</td>
                  <td className="px-6 py-4">{fmtDate(purchase.purchasedAt)}</td>
                  <td className="px-6 py-4">{purchase._count?.items ?? 0}</td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{money(purchase.total)}</td>
                  <td className="px-6 py-4">
                    <StatusBadge value={purchase.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/dashboard/purchases/${purchase.id}`}
                        className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline"
                      >
                        <Eye className="h-4 w-4" /> View
                      </Link>
                      {canEdit(purchase) && (
                        <Link
                          href={`/dashboard/purchases/update/${purchase.id}`}
                          className="inline-flex items-center gap-1 font-medium text-lime-600 hover:underline"
                        >
                          <Pencil className="h-4 w-4" /> Edit
                        </Link>
                      )}
                      {canDelete(purchase) && (
                        <button
                          type="button"
                          onClick={() => handleDelete(purchase)}
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