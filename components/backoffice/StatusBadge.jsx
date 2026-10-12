// components/backoffice/StatusBadge.jsx
// Route: n/a (shared badge for purchase statuses and stock movement types)
import React from "react";

const STYLES = {
  DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
  ORDERED: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  RECEIVED: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  PURCHASE: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  SALE: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  RETURN_IN: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
  RETURN_OUT: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  ADJUSTMENT: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  DAMAGED: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  OPENING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
};

export default function StatusBadge({ value }) {
  const label = String(value ?? "").replace("_", " ");
  return (
    <span
      className={`rounded px-2.5 py-0.5 text-xs font-medium capitalize ${
        STYLES[value] ?? "bg-gray-100 text-gray-800"
      }`}
    >
      {label.toLowerCase()}
    </span>
  );
}