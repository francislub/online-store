// components/backoffice/TableActions.jsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { Download, Loader2, Search, Trash2 } from "lucide-react";

export default function TableActions({
  searchValue = "",
  placeholder = "Search for items",
  onSearch,
  onExport,
  onBulkDelete,
  selectedCount = 0,
  exporting = false,
  deleting = false,
}) {
  const [value, setValue] = useState(searchValue);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (!onSearch) return;
    const timer = setTimeout(() => onSearch(value.trim()), 400);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700 md:flex-row md:items-center">
      <button
        type="button"
        onClick={onExport}
        disabled={!onExport || exporting}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-lime-600 px-4 py-2.5 text-sm font-medium text-lime-700 transition-colors hover:bg-lime-50 focus:outline-none focus:ring-4 focus:ring-lime-300 disabled:cursor-not-allowed disabled:opacity-50 dark:border-lime-500 dark:text-lime-400 dark:hover:bg-lime-500/10 dark:focus:ring-lime-800"
      >
        {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        <span>Export</span>
      </button>

      <div className="flex-grow">
        <label htmlFor="table-search" className="sr-only">
          Search
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3">
            <Search className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </div>
          <input
            type="text"
            id="table-search"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            className="block w-full rounded-lg border border-gray-300 bg-gray-50 py-2.5 ps-10 text-sm text-gray-900 focus:border-lime-500 focus:ring-lime-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-lime-500 dark:focus:ring-lime-500"
            placeholder={placeholder}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onBulkDelete}
        disabled={!onBulkDelete || selectedCount === 0 || deleting}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-red-900"
      >
        {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        <span>Bulk Delete{selectedCount > 0 ? ` (${selectedCount})` : ""}</span>
      </button>
    </div>
  );
}