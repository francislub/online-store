// components/backoffice/CustomerPicker.jsx
// Route: n/a (pick a registered customer or leave empty for walk-in)
"use client";

import React from "react";
import { X } from "lucide-react";
import LookupSelect from "@/components/backoffice/LookupSelect";

export default function CustomerPicker({ customer, onChange }) {
  if (customer) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-lime-200 bg-lime-50 px-4 py-2.5 text-sm dark:border-lime-900 dark:bg-gray-700">
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{customer.name}</div>
          <div className="text-xs text-gray-500">{[customer.phone, customer.email].filter(Boolean).join(" • ")}</div>
        </div>
        <button type="button" onClick={() => onChange(null)} className="text-gray-500 hover:text-red-600" aria-label="Clear customer">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <LookupSelect
      type="customers"
      placeholder="Search registered customer (optional, leave empty for walk-in)"
      onSelect={onChange}
      renderOption={(c) => (
        <div>
          <div className="font-medium">{c.name}</div>
          <div className="text-xs text-gray-500">{[c.phone, c.email].filter(Boolean).join(" • ")}</div>
        </div>
      )}
    />
  );
}
