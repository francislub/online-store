// Route: /dashboard/quotes
// File: src/app/(backoffice)/dashboard/quotes/page.jsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Pencil, Trash2 } from "lucide-react";
import PageHeader from "@/components/backoffice/PageHeader";
import TableActions from "@/components/backoffice/TableActions";
import StatusBadge from "@/components/backoffice/StatusBadge";
import { makeDeleteRequest, makeGetRequest } from "@/lib/apiRequest";
import { QUOTE_STATUSES } from "@/lib/constants";
import { downloadCsv } from "@/lib/csv";
import { fmtDate, money } from "@/lib/format";

const STATUSES = ["ALL", ...QUOTE_STATUSES];

export default function Quotes() {
  const [quotes, setQuotes] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadQuotes = useCallback(async () => {
    setLoading(true);
    const query = new URLSearchParams({ search });
    if (status !== "ALL") query.set("status", status);
    if (from) query.set("from", from);
    if (to) query.set("to", to);
    const data = await makeGetRequest(`/api/quotes?${query.toString()}`);
    setQuotes(Array.isArray(data) ? data : []);
    setSelected([]);
    setLoading(false);
  }, [search, status, from, to]);

  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  const stats = useMemo(() => {
    const open = quotes.filter((q) => ["DRAFT", "SENT", "ACCEPTED"].includes(q.status));
    const converted = quotes.filter((q) => q.status === "CONVERTED");
    const decided = quotes.filter((q) => ["ACCEPTED", "CONVERTED", "REJECTED", "EXPIRED"].includes(q.status));
    return {
      openValue: open.reduce((sum, q) => sum + q.total, 0),
      openCount: open.length,
      convertedValue: converted.reduce((sum, q) => sum + q.total, 0),
      winRate: decided.length ? Math.round(((converted.length + quotes.filter((q) => q.status === "ACCEPTED").length) / decided.length) * 100) : 0,
    };
  }, [quotes]);

  const allSelected = quotes.length > 0 && selected.length === quotes.length;
  const toggleAll = () => setSelected(allSelected ? [] : quotes.map((q) => q.id));
  const toggleOne = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  async function handleDelete(quote) {
    if (!window.confirm(`Delete quote ${quote.number}?`)) return;
    const result = await makeDeleteRequest(setDeleting, `/api/quotes/${quote.id}`, null, "Quote deleted");
    if (result) loadQuotes();
  }

  async function handleBulkDelete() {
    if (!window.confirm(`Delete ${selected.length} selected quote(s)? Converted quotes are kept.`)) return;
    const result = await makeDeleteRequest(setDeleting, "/api/quotes", { ids: selected });
    if (result) loadQuotes();
  }

  function handleExport() {
    setExporting(true);
    try {
      downloadCsv(
        "quotes.csv",
        ["Date", "Quote No", "Customer", "Status", "Total", "Valid Until", "Created By"],
        quotes.map((q) => [fmtDate(q.createdAt), q.number, q.customer?.name ?? "", q.status, q.total, fmtDate(q.validUntil), q.createdBy?.name ?? ""])
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
      <PageHeader heading="Quotes" href="/dashboard/quotes/new" linkTitle="New Quote" />

      <TableActions
        placeholder="Search by quote no, customer or notes"
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
            <div className="text-xs text-gray-500">Open pipeline ({stats.openCount})</div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">{money(stats.openValue)}</div>
          </div>
          <div className={tile}>
            <div className="text-xs text-gray-500">Converted to orders</div>
            <div className="text-lg font-bold text-lime-700">{money(stats.convertedValue)}</div>
          </div>
          <div className={tile}>
            <div className="text-xs text-gray-500">Win rate</div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">{stats.winRate}%</div>
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
              <th className="px-6 py-3">Quote</th>
              <th className="px-6 py-3">Customer</th>
              <th className="px-6 py-3">Total</th>
              <th className="px-6 py-3">Valid until</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center">Loading...</td>
              </tr>
            ) : quotes.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center">No quotes found</td>
              </tr>
            ) : (
              quotes.map((quote) => (
                <tr key={quote.id} className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-600">
                  <td className="p-4">
                    <input type="checkbox" checked={selected.includes(quote.id)} onChange={() => toggleOne(quote.id)} />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">{fmtDate(quote.createdAt)}</td>
                  <td className="px-6 py-4">
                    <Link href={`/dashboard/quotes/${quote.id}`} className="font-medium text-gray-900 hover:underline dark:text-white">
                      {quote.number}
                    </Link>
                    <div className="text-xs">{quote.items?.length ?? 0} item(s) • by {quote.createdBy?.name ?? "-"}</div>
                  </td>
                  <td className="px-6 py-4">{quote.customer?.name ?? "Prospect"}</td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{money(quote.total)}</td>
                  <td className="whitespace-nowrap px-6 py-4">{fmtDate(quote.validUntil)}</td>
                  <td className="px-6 py-4">
                    <StatusBadge value={quote.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <Link href={`/dashboard/quotes/${quote.id}`} className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline">
                        <Eye className="h-4 w-4" /> View
                      </Link>
                      {quote.status !== "CONVERTED" && (
                        <>
                          <Link href={`/dashboard/quotes/update/${quote.id}`} className="inline-flex items-center gap-1 font-medium text-lime-600 hover:underline">
                            <Pencil className="h-4 w-4" /> Edit
                          </Link>
                          <button type="button" onClick={() => handleDelete(quote)} className="inline-flex items-center gap-1 font-medium text-red-600 hover:underline">
                            <Trash2 className="h-4 w-4" /> Delete
                          </button>
                        </>
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
