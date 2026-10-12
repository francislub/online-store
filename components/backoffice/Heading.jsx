// components/backoffice/Heading.jsx
import React from "react";

export default function Heading({ title, subtitle, badge }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-50">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        )}
      </div>
      {badge && (
        <span className="w-fit rounded-full bg-lime-100 px-3 py-1 text-xs font-semibold capitalize text-lime-800 dark:bg-lime-500/15 dark:text-lime-300">
          {badge}
        </span>
      )}
    </div>
  );
}