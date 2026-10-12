// components/backoffice/WeeklySalesChart.jsx
import { TrendingUp } from "lucide-react";
import Panel from "./Panel";
import { formatCompact, formatNumber, formatUGX } from "@/lib/format";

export default function WeeklySalesChart({ data, showMoney }) {
  const key = showMoney ? "total" : "count";
  const max = Math.max(...data.map((day) => day[key]), 0);
  const sum = data.reduce((acc, day) => acc + day[key], 0);
  const orders = data.reduce((acc, day) => acc + day.count, 0);

  return (
    <Panel
      title={showMoney ? "Weekly Sales" : "Weekly Orders"}
      subtitle="Last 7 days, cancelled orders excluded"
      icon={TrendingUp}
      tone="green"
      className="h-full"
    >
      <div className="mb-5 flex flex-wrap items-baseline gap-x-6 gap-y-1">
        <p className="text-2xl font-bold text-slate-800 dark:text-slate-50">
          {showMoney ? formatUGX(sum) : formatNumber(sum)}
        </p>
        {showMoney && (
          <p className="text-sm text-slate-500 dark:text-slate-400">{formatNumber(orders)} orders</p>
        )}
      </div>

      <div className="flex h-60 items-stretch gap-2 sm:gap-4">
        {data.map((day, index) => {
          const value = day[key];
          const height = max > 0 ? Math.max((value / max) * 100, value > 0 ? 4 : 1.5) : 1.5;
          const isToday = index === data.length - 1;
          return (
            <div
              key={day.date}
              className="group flex flex-1 flex-col items-center gap-2"
              title={`${day.label}: ${showMoney ? formatUGX(day.total) : formatNumber(day.count)} (${day.count} orders)`}
            >
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 sm:text-xs">
                {showMoney ? formatCompact(day.total) : day.count}
              </span>
              <div className="relative w-full flex-1">
                <div
                  className={`absolute bottom-0 w-full rounded-t-lg transition-all duration-300 ${
                    isToday
                      ? "bg-gradient-to-t from-emerald-600 to-lime-400 dark:from-emerald-500 dark:to-teal-300"
                      : "bg-gradient-to-t from-slate-300 to-slate-200 group-hover:from-emerald-600 group-hover:to-lime-400 dark:from-slate-600 dark:to-slate-500 dark:group-hover:from-emerald-500 dark:group-hover:to-teal-300"
                  }`}
                  style={{ height: `${height}%` }}
                />
              </div>
              <span
                className={`text-xs ${
                  isToday
                    ? "font-bold text-emerald-600 dark:text-emerald-400"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {day.label}
              </span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}