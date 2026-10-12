// components/backoffice/Panel.jsx
import Link from "next/link";
import { tones } from "./dashboardTones";

export function PanelEmpty({ text }) {
  return (
    <div className="flex h-full min-h-[8rem] items-center justify-center rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-600 dark:text-slate-400">
      {text}
    </div>
  );
}

export default function Panel({ title, subtitle, icon: Icon, tone = "green", action, className = "", children }) {
  const palette = tones[tone] || tones.green;
  return (
    <section
      className={`rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700 ${className}`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {Icon && (
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${palette.soft}`}>
              <Icon className="h-5 w-5" />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-slate-800 dark:text-slate-50">{title}</h3>
            {subtitle && <p className="truncate text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
        </div>
        {action && (
          <Link
            href={action.href}
            className={`shrink-0 text-xs font-semibold hover:underline ${palette.text}`}
          >
            {action.label}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}