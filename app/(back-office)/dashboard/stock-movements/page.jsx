// Route: /dashboard/stock-movements
// File: src/app/(backoffice)/dashboard/stock-movements/page.jsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import PageHeader from "@/components/backoffice/PageHeader";
import TableActions from "@/components/backoffice/TableActions";
import StatusBadge from "@/components/backoffice/StatusBadge";
import { makeGetRequest } from "@/lib/apiRequest";

const TYPES = ["ALL", "PURCHASE", "SALE", "RETURN_IN", "RETURN_OUT", "ADJUSTMENT", "DAMAGED", "OPENING"];

const fmtDateTime = (value) =>
  new Date(value).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function StockMovements() {
  const [movements, setMovements] = useState([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const loadMovements = useCallback(async () => {
    setLoading(true);
    const query = new URLSearchParams({ search });
    if (type !== "ALL") query.set("type", type);
    const data = await makeGetRequest(`/api/stock-movements?${query.toString()}`);
    setMovements(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [search, type]);

  useEffect(() => {
    loadMovements();
  }, [loadMovements]);

  function handleExport() {
    setExporting(true);
    try {
      const header = ["Date", "Product", "SKU", "Type", "Quantity", "Balance After", "Reference", "Notes", "By"];
      const rows = movements.map((m) => [
        fmtDateTime(m.createdAt),
        m.product?.name ?? "",
        m.product?.sku ?? "",
        m.type,
        m.quantity,
        m.balanceAfter ?? "",
        m.reference ?? "",
        m.notes ?? "",
        m.createdBy?.name ?? "",
      ]);
      const csv = [header, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        .join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "stock-movements.csv";
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <PageHeader heading="Stock Movements" href="/dashboard/stock-movements/new" linkTitle="New Movement" />

      {/* Export and search (no bulk delete: the stock ledger is never deleted) */}
      <TableActions
        placeholder="Search by product, SKU or reference"
        onSearch={setSearch}
        onExport={handleExport}
        exporting={exporting}
      />

      {/* Type filter */}
      <div className="mt-4 flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium capitalize transition-colors ${
              type === t
                ? "bg-lime-600 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700"
            }`}
          >
            {t.replace("_", " ").toLowerCase()}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="relative mt-4 overflow-x-auto rounded-lg shadow-md">
        <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
          <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Product</th>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Quantity</th>
              <th className="px-6 py-3">Balance</th>
              <th className="px-6 py-3">Reference</th>
              <th className="px-6 py-3">Notes</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center">Loading...</td>
              </tr>
            ) : movements.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center">No stock movements found</td>
              </tr>
            ) : (
              movements.map((m) => (
                <tr
                  key={m.id}
                  className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-600"
                >
                  <td className="whitespace-nowrap px-6 py-4">{fmtDateTime(m.createdAt)}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 dark:text-white">{m.product?.name ?? "Deleted product"}</div>
                    <div className="text-xs">SKU: {m.product?.sku ?? "-"}</div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge value={m.type} />
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-semibold ${m.quantity > 0 ? "text-green-600" : "text-red-600"}`}>
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4">{m.balanceAfter ?? "-"}</td>
                  <td className="px-6 py-4">{m.reference ?? "-"}</td>
                  <td className="max-w-xs truncate px-6 py-4">
                    {m.notes ?? "-"}
                    {m.createdBy?.name && <div className="text-xs">by {m.createdBy.name}</div>}
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