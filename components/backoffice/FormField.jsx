// components/backoffice/FormField.jsx
// Route: n/a (label + error wrapper for native selects / dates used in backoffice forms)
import React from "react";

export const inputClass =
  "block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-lime-500 focus:ring-lime-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400";

export default function FormField({ label, error, hint, className = "", children }) {
  return (
    <div className={className}>
      {label && <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">{label}</label>}
      {children}
      {hint && !error && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
