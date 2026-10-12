// Route: /dashboard/notifications
// File: src/app/(backoffice)/dashboard/notifications/page.jsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCheck, ChevronLeft, ChevronRight, RefreshCw, Trash2 } from "lucide-react";
import CategoryIcon from "@/components/backoffice/CategoryIcon";
import { CATEGORIES } from "@/lib/activityConfig";
import { makeDeleteRequest, makeGetRequest, makePutRequest } from "@/lib/apiRequest";
import { timeAgo } from "@/lib/timeAgo";

export default function Notifications() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("all");
  const [type, setType] = useState("ALL");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      const result = await makeGetRequest(`/api/notifications?filter=${filter}&type=${type}&page=${page}&limit=20`);
      if (result) setData(result);
      if (!silent) setLoading(false);
    },
    [filter, type, page]
  );

  useEffect(() => {
    load();
  }, [load]);

  // pick up new activity without a manual refresh
  useEffect(() => {
    const timer = setInterval(() => load(true), 30000);
    return () => clearInterval(timer);
  }, [load]);

  const items = data?.items ?? [];

  function toggle(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleAll() {
    setSelected(selected.length === items.length ? [] : items.map((n) => n.id));
  }

  async function markRead(payload) {
    const result = await makePutRequest(setBusy, "/api/notifications", payload, "Notifications");
    if (result) {
      setSelected([]);
      load(true);
    }
  }

  async function remove(payload) {
    const result = await makeDeleteRequest(setBusy, "/api/notifications", payload);
    if (result) {
      setSelected([]);
      load(true);
    }
  }

  const btn =
    "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50";
  const outline = `${btn} border border-slate-300 text-slate-700 hover:bg-slate-50 focus:ring-slate-300 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700`;

  return (
    <div>
      <div className="mb-6 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Notifications</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {data ? `${data.unreadCount} unread` : "Loading..."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => load()} disabled={loading} className={outline}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
            <button
              type="button"
              onClick={() => markRead({ all: true })}
              disabled={busy || !data?.unreadCount}
              className={outline}
            >
              <CheckCheck className="h-4 w-4" /> Mark all read
            </button>
            <button type="button" onClick={() => remove({ allRead: true })} disabled={busy} className={outline}>
              <Trash2 className="h-4 w-4" /> Clear read
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {[
            { id: "all", title: "All" },
            { id: "unread", title: "Unread" },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setFilter(f.id);
                setPage(1);
              }}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                filter === f.id
                  ? "bg-lime-600 text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700"
              }`}
            >
              {f.title}
            </button>
          ))}
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 bg-gray-50 p-2 text-xs text-gray-900 focus:border-lime-500 focus:ring-lime-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="ALL">All categories</option>
            {Object.entries(CATEGORIES).map(([key, c]) => (
              <option key={key} value={key}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {selected.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-lime-50 p-2 text-sm dark:bg-slate-700">
            <span className="px-2 font-medium">{selected.length} selected</span>
            <button type="button" onClick={() => markRead({ ids: selected })} disabled={busy} className={outline}>
              <CheckCheck className="h-4 w-4" /> Mark read
            </button>
            <button type="button" onClick={() => remove({ ids: selected })} disabled={busy} className={outline}>
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </div>
        )}
      </div>

      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
        {loading && !data ? (
          <p className="p-6 text-center">Loading notifications...</p>
        ) : !data ? (
          <p className="p-6 text-center">Could not load notifications</p>
        ) : items.length === 0 ? (
          <p className="p-10 text-center text-slate-500">You are all caught up. No notifications here.</p>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-2 text-xs text-slate-500 dark:border-slate-700">
              <input
                type="checkbox"
                checked={selected.length === items.length}
                onChange={toggleAll}
                className="h-4 w-4 rounded border-gray-300 text-lime-600 focus:ring-lime-500"
              />
              Select all on this page
            </div>
            <ul className={`transition-opacity ${loading ? "opacity-50" : ""}`}>
              {items.map((n) => {
                const unread = !n.readAt;
                const href = CATEGORIES[n.type]?.href;
                return (
                  <li
                    key={n.id}
                    className={`flex items-start gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 dark:border-slate-700 ${
                      unread ? "bg-lime-50/60 dark:bg-slate-700/40" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(n.id)}
                      onChange={() => toggle(n.id)}
                      className="mt-2 h-4 w-4 rounded border-gray-300 text-lime-600 focus:ring-lime-500"
                    />
                    <CategoryIcon type={n.type} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-sm ${unread ? "font-semibold" : "font-medium"} text-slate-900 dark:text-white`}>
                          {n.title}
                        </span>
                        {unread && <span className="h-2 w-2 rounded-full bg-lime-600" />}
                        <span className="text-[11px] text-slate-400">{timeAgo(n.createdAt)}</span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{n.message}</p>
                      <div className="mt-1 flex gap-3 text-xs">
                        {href && (
                          <Link href={href} className="font-medium text-lime-700 hover:underline dark:text-lime-400">
                            Open {CATEGORIES[n.type].label.toLowerCase()}
                          </Link>
                        )}
                        {unread && (
                          <button
                            type="button"
                            onClick={() => markRead({ ids: [n.id] })}
                            disabled={busy}
                            className="text-slate-500 hover:underline"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="flex items-center justify-between px-4 py-3 text-xs text-slate-500">
              <span>
                Page {data.page} of {data.pages} &bull; {data.total} total
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={data.page <= 1}
                  className={outline}
                >
                  <ChevronLeft className="h-4 w-4" /> Prev
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={data.page >= data.pages}
                  className={outline}
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}