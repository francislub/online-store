// components/backoffice/LookupSelect.jsx
// Route: n/a (search-as-you-type picker backed by /api/lookups)
"use client";

import React, { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { makeGetRequest } from "@/lib/apiRequest";
import { inputClass } from "@/components/backoffice/FormField";

export default function LookupSelect({
  type, // "products" | "customers" | "orders"
  placeholder = "Search...",
  onSelect,
  renderOption,
  params = {},
  clearOnSelect = true,
}) {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const boxRef = useRef(null);
  const paramsKey = JSON.stringify(params);

  // debounce the search so we don't hit the API on every keystroke
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setBusy(true);
      const query = new URLSearchParams({ type, search: term, ...params });
      const data = await makeGetRequest(`/api/lookups?${query.toString()}`);
      if (!cancelled) {
        setResults(Array.isArray(data) ? data : []);
        setBusy(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term, open, type, paramsKey]);

  useEffect(() => {
    function onClickAway(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, []);

  function choose(item) {
    onSelect(item);
    setOpen(false);
    setTerm(clearOnSelect ? "" : term);
  }

  return (
    <div ref={boxRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={term}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setTerm(e.target.value);
            setOpen(true);
          }}
          placeholder={placeholder}
          className={`${inputClass} pl-9`}
          autoComplete="off"
        />
      </div>

      {open && (
        <ul className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
          {busy && <li className="px-4 py-3 text-sm text-gray-500">Searching...</li>}
          {!busy && results.length === 0 && <li className="px-4 py-3 text-sm text-gray-500">No results</li>}
          {!busy &&
            results.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => choose(item)}
                  className="block w-full px-4 py-2.5 text-left text-sm hover:bg-lime-50 dark:text-white dark:hover:bg-gray-700"
                >
                  {renderOption(item)}
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
