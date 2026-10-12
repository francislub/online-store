// Route: /dashboard/audit-logs
// File: src/app/(backoffice)/dashboard/audit-logs/page.jsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, Search } from "lucide-react";
import { makeGetRequest } from "@/lib/apiRequest";
import { fmtDateTime } from "@/lib/timeAgo";

const label = (s) => String(s).replace(/_/g, " ").toLowerCase();

export default function AuditLogs() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [entity, setEntity] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "25", entity });
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (q) params.set("q", q);
    const result = await makeGetRequest(`/api/audit-logs?${params.toString()}`);
    if (result) setData(result);
    setLoading(false);
  }, [page, entity, from, to, q]);

  useEffect(() => {
    load();
  }, [load]);

  function submitSearch(e) {
    e.preventDefault();
    setPage(1);
    setQ(search.trim());
  }

  const input =
    "rounded-lg border border-gray-300 bg-gray-50 p-2 text-sm text-gray-900 focus:border-lime-500 focus:ring-lime-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white";
  const btn =
    "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50 border border-slate-300 text-slate-700 hover:bg-slate-50 focus:ring-slate-300 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700";

  const items = data?.items ?? [];

  return (
    <div>
      <div className="mb-6 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Audit Logs</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {data ? `${data.total} recorded action(s)` : "Loading..."}
            </p>
          </div>
          <button type="button" onClick={load} disabled={loading} className={btn}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <form onSubmit={submitSearch} className="flex items-end gap-2">
            <label className="text-xs text-gray-600 dark:text-gray-400">
              Search
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Action, user or record id"
                className={`${input} mt-1 block w-56`}
              />
            </label>
            <button type="submit" className={btn}>
              <Search className="h-4 w-4" />
            </button>
          </form>
          <label className="text-xs text-gray-600 dark:text-gray-400">
            Entity
            <select
              value={entity}
              onChange={(e) => {
                setEntity(e.target.value);
                setPage(1);
              }}
              className={`${input} mt-1 block`}
            >
              <option value="ALL">All</option>
              {(data?.entities ?? []).map((en) => (
                <option key={en} value={en}>
                  {en}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-gray-600 dark:text-gray-400">
            From
            <input
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
              className={`${input} mt-1 block`}
            />
          </label>
          <label className="text-xs text-gray-600 dark:text-gray-400">
            To
            <input
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
              className={`${input} mt-1 block`}
            />
          </label>
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
        {loading && !data ? (
          <p className="p-6 text-center">Loading audit logs...</p>
        ) : !data ? (
          <p className="p-6 text-center">Could not load audit logs</p>
        ) : items.length === 0 ? (
          <p className="p-10 text-center text-slate-500">No activity matches these filters.</p>
        ) : (
          <div className={`overflow-x-auto transition-opacity ${loading ? "opacity-50" : ""}`}>
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Who</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Entity</th>
                  <th className="px-4 py-3">Details</th>
                </tr>
              </thead>
              <tbody>
                {items.map((log) => (
                  <tr key={log.id} className="border-t border-slate-100 align-top dark:border-slate-700">
                    <td className="whitespace-nowrap px-4 py-3 text-xs">{fmtDateTime(log.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 dark:text-white">{log.actor?.name ?? "Unknown"}</div>
                      <div className="text-[11px] capitalize text-slate-400">{label(log.actor?.role ?? "")}</div>
                    </td>
                    <td className="px-4 py-3 font-medium capitalize">{label(log.action)}</td>
                    <td className="px-4 py-3">
                      <div>{log.entity}</div>
                      {log.entityId && <div className="font-mono text-[10px] text-slate-400">{log.entityId}</div>}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {log.metadata?.message && <div className="mb-1">{log.metadata.message}</div>}
                      {log.metadata && Object.keys(log.metadata).length > 1 && (
                        <details>
                          <summary className="cursor-pointer text-lime-700 dark:text-lime-400">View data</summary>
                          <pre className="mt-1 max-w-md overflow-x-auto rounded bg-slate-50 p-2 text-[10px] dark:bg-slate-900">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && items.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500 dark:border-slate-700">
            <span>
              Page {data.page} of {data.pages}
            </span>
            <div className="flex gap-2">
              <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={data.page <= 1} className={btn}>
                <ChevronLeft className="h-4 w-4" /> Prev
              </button>
              <button type="button" onClick={() => setPage((p) => p + 1)} disabled={data.page >= data.pages} className={btn}>
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}