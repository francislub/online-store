// components/backoffice/OrderStatusChart.jsx
import { PieChart } from "lucide-react";
import Panel from "./Panel";
import { statusMeta } from "./dashboardTones";
import { formatNumber } from "@/lib/format";

export default function OrderStatusChart({ counts, total }) {
  const entries = Object.keys(statusMeta).map((status) => ({
    status,
    ...statusMeta[status],
    count: counts[status] || 0,
  }));

  let cursor = 0;
  const stops = entries
    .filter((entry) => entry.count > 0)
    .map((entry) => {
      const start = cursor;
      cursor += (entry.count / total) * 100;
      return `${entry.hex} ${start}% ${cursor}%`;
    });

  const background = total > 0 ? `conic-gradient(${stops.join(", ")})` : "conic-gradient(#cbd5e1 0% 100%)";

  return (
    <Panel title="Orders by Status" subtitle="All orders in the system" icon={PieChart} tone="purple" className="h-full">
      <div className="flex flex-col items-center gap-6">
        <div className="relative h-44 w-44 rounded-full" style={{ background }}>
          <div className="absolute inset-5 flex flex-col items-center justify-center rounded-full bg-white dark:bg-slate-800">
            <span className="text-2xl font-bold text-slate-800 dark:text-slate-50">{formatNumber(total)}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Total orders</span>
          </div>
        </div>

        <ul className="w-full space-y-2">
          {entries.map((entry) => (
            <li key={entry.status} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.hex }} />
                {entry.label}
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-50">
                {formatNumber(entry.count)}
                <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">
                  {total > 0 ? Math.round((entry.count / total) * 100) : 0}%
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}