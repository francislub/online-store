// components/backoffice/LowStockPanel.jsx
import { AlertTriangle } from "lucide-react";
import Panel, { PanelEmpty } from "./Panel";
import { formatNumber } from "@/lib/format";

export default function LowStockPanel({ items, lowCount, outCount }) {
  return (
    <Panel
      title="Stock Alerts"
      subtitle={`${formatNumber(outCount)} out of stock, ${formatNumber(lowCount)} running low`}
      icon={AlertTriangle}
      tone="orange"
      action={{ href: "/dashboard/products", label: "Manage" }}
    >
      {items.length === 0 ? (
        <PanelEmpty text="All products are well stocked" />
      ) : (
        <ul className="space-y-4">
          {items.map((item) => {
            const out = item.stock <= 0;
            const fill = Math.min(100, (item.stock / Math.max(item.reorderLevel, 1)) * 100);
            return (
              <li key={item.id}>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-50">{item.name}</p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{item.sku}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      out
                        ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                        : "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300"
                    }`}
                  >
                    {out ? "Out of stock" : `${formatNumber(item.stock)} left`}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                  <div
                    className={`h-full rounded-full ${out ? "bg-rose-500" : "bg-orange-500"}`}
                    style={{ width: `${fill}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}