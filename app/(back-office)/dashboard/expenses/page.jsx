// Route: /dashboard/expenses
// File: src/app/(backoffice)/dashboard/expenses/page.jsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import PageHeader from "@/components/backoffice/PageHeader";
import TableActions from "@/components/backoffice/TableActions";
import StatusBadge from "@/components/backoffice/StatusBadge";
import { makeDeleteRequest, makeGetRequest } from "@/lib/apiRequest";

const money = (value) => `UGX ${Number(value ?? 0).toLocaleString()}`;
const fmtDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-";

const CATEGORIES = ["ALL", "RENT", "TRANSPORT", "SALARIES", "UTILITIES", "REPAIRS", "MARKETING", "SUPPLIES", "OTHER"];

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    const query = new URLSearchParams({ search });
    if (category !== "ALL") query.set("category", category);
    if (from) query.set("from", from);
    if (to) query.set("to", to);
    const data = await makeGetRequest(`/api/expenses?${query.toString()}`);
    setExpenses(Array.isArray(data) ? data : []);
    setSelected([]);
    setLoading(false);
  }, [search, category, from, to]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const total = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);
  const allSelected = expenses.length > 0 && selected.length === expenses.length;

  function toggleAll() {
    setSelected(allSelected ? [] : expenses.map((e) => e.id));
  }

  function toggleOne(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleDelete(expense) {
    if (!window.confirm(`Delete expense "${expense.title}"?`)) return;
    const result = await makeDeleteRequest(setDeleting, `/api/expenses/${expense.id}`, null, "Expense deleted");
    if (result) loadExpenses();
  }

  async function handleBulkDelete() {
    if (!window.confirm(`Delete ${selected.length} selected expense(s)?`)) return;
    const result = await makeDeleteRequest(setDeleting, "/api/expenses", { ids: selected });
    if (result) loadExpenses();
  }

  function handleExport() {
    setExporting(true);
    try {
      const header = ["Date", "Title", "Category", "Amount", "Description", "Recorded By"];
      const rows = expenses.map((e) => [
        fmtDate(e.spentAt),
        e.title,
        e.category,
        e.amount,
        e.description ?? "",
        e.recordedBy?.name ?? "",
      ]);
      const csv = [header, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        .join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "expenses.csv";
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  const dateInput =
    "rounded-lg border border-gray-300 bg-gray-50 p-2 text-sm text-gray-900 focus:border-lime-500 focus:ring-lime-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white";

  return (
    <div>
      <PageHeader heading="Expenses" href="/dashboard/expenses/new" linkTitle="New Expense" />

      <TableActions
        placeholder="Search expenses by title or description"
        onSearch={setSearch}
        onExport={handleExport}
        onBulkDelete={handleBulkDelete}
        selectedCount={selected.length}
        exporting={exporting}
        deleting={deleting}
      />

      {/* Category filter */}
      <div className="mt-4 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium capitalize transition-colors ${
              category === c
                ? "bg-lime-600 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700"
            }`}
          >
            {c.toLowerCase()}
          </button>
        ))}
      </div>

      {/* Date range + total */}
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
        <div className="rounded-lg bg-white px-5 py-3 text-right shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <div className="text-xs text-gray-500">Total ({expenses.length} expenses)</div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">{money(total)}</div>
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
              <th className="px-6 py-3">Title</th>
              <th className="px-6 py-3">Category</th>
              <th className="px-6 py-3">Amount</th>
              <th className="px-6 py-3">Recorded by</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center">Loading...</td>
              </tr>
            ) : expenses.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center">No expenses found</td>
              </tr>
            ) : (
              expenses.map((expense) => (
                <tr
                  key={expense.id}
                  className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-600"
                >
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selected.includes(expense.id)}
                      onChange={() => toggleOne(expense.id)}
                    />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">{fmtDate(expense.spentAt)}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 dark:text-white">{expense.title}</div>
                    {expense.description && <div className="max-w-xs truncate text-xs">{expense.description}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge value={expense.category} />
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{money(expense.amount)}</td>
                  <td className="px-6 py-4">{expense.recordedBy?.name ?? "-"}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/dashboard/expenses/update/${expense.id}`}
                        className="inline-flex items-center gap-1 font-medium text-lime-600 hover:underline"
                      >
                        <Pencil className="h-4 w-4" /> Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(expense)}
                        className="inline-flex items-center gap-1 font-medium text-red-600 hover:underline"
                      >
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