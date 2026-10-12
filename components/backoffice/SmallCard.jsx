// components/backoffice/SmallCard.jsx
import { tones } from "./dashboardTones";

export default function SmallCard({ status }) {
  const { title, value, icon: Icon, tone: toneKey, hint, share } = status;
  const tone = tones[toneKey] || tones.green;

  return (
    <div
      className={`rounded-xl border-l-4 bg-white p-4 shadow-sm ring-1 ring-slate-200 transition-shadow hover:shadow-md dark:bg-slate-800 dark:ring-slate-700 ${tone.accent}`}
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${tone.soft}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <h3 className="truncate text-xl font-bold text-slate-800 dark:text-slate-50" title={value}>
            {value}
          </h3>
        </div>
      </div>
      {typeof share === "number" && (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
          <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${Math.min(100, share)}%` }} />
        </div>
      )}
      {hint && <p className="mt-2 truncate text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  );
}