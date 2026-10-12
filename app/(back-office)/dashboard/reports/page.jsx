// Route: /dashboard/reports
// File: src/app/(backoffice)/dashboard/reports/page.jsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Printer, RefreshCw } from "lucide-react";
import ReportDocument from "@/components/backoffice/ReportDocument";
import { makeGetRequest } from "@/lib/apiRequest";
import { presetRange } from "@/lib/dates";

const PRESETS = [
  { id: "today", title: "Today" },
  { id: "week", title: "Last 7 days" },
  { id: "month", title: "This month" },
  { id: "lastMonth", title: "Last month" },
  { id: "year", title: "This year" },
];

export default function Reports() {
  const initial = presetRange("month");
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [preset, setPreset] = useState("month");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadReport = useCallback(async () => {
    setLoading(true);
    const data = await makeGetRequest(`/api/reports?from=${from}&to=${to}`);
    if (data) setReport(data);
    setLoading(false);
  }, [from, to]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  function applyPreset(id) {
    const range = presetRange(id);
    setPreset(id);
    setFrom(range.from);
    setTo(range.to);
  }

  const btn =
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50";
  const dateInput =
    "rounded-lg border border-gray-300 bg-gray-50 p-2 text-sm text-gray-900 focus:border-lime-500 focus:ring-lime-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white";

  return (
    <div>
      {/* Toolbar (hidden when printing because only .print-area is visible) */}
      <div className="mb-6 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
        <h1 className="mb-3 text-xl font-semibold text-slate-900 dark:text-white">Reports</h1>

        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p.id)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                preset === p.id
                  ? "bg-lime-600 text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700"
              }`}
            >
              {p.title}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-xs text-gray-600 dark:text-gray-400">
              From
              <input
                type="date"
                value={from}
                max={to}
                onChange={(e) => {
                  setPreset("custom");
                  setFrom(e.target.value);
                }}
                className={`${dateInput} mt-1 block`}
              />
            </label>
            <label className="text-xs text-gray-600 dark:text-gray-400">
              To
              <input
                type="date"
                value={to}
                min={from}
                onChange={(e) => {
                  setPreset("custom");
                  setTo(e.target.value);
                }}
                className={`${dateInput} mt-1 block`}
              />
            </label>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={loadReport}
              disabled={loading}
              className={`${btn} border border-slate-300 text-slate-700 hover:bg-slate-50 focus:ring-slate-300 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700`}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              disabled={!report}
              className={`${btn} bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-300 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white`}
            >
              <Printer className="h-4 w-4" /> Print / Save PDF
            </button>
          </div>
        </div>
      </div>

      {/* A4 sheet: always white, even in dark theme, so it prints correctly */}
      {loading && !report ? (
        <p className="p-6 text-center">Building report...</p>
      ) : !report ? (
        <p className="p-6 text-center">Could not load the report</p>
      ) : (
        <div className={`overflow-x-auto pb-6 transition-opacity ${loading ? "opacity-50" : ""}`}>
          <ReportDocument report={report} />
        </div>
      )}
    </div>
  );
}