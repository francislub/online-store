// components/backoffice/BestSellingProductsCharts.jsx
import { Trophy } from "lucide-react";
import Panel, { PanelEmpty } from "./Panel";
import { tones } from "./dashboardTones";
import { formatNumber, formatUGX } from "@/lib/format";

const rankTones = ["green", "blue", "purple", "orange", "teal"];

export default function BestSellingProductsCharts({ products, showMoney }) {
  const max = Math.max(...products.map((product) => product.units), 0);

  return (
    <Panel
      title="Best Selling Products"
      subtitle="Top 5 by units sold, cancelled orders excluded"
      icon={Trophy}
      tone="orange"
      action={{ href: "/dashboard/products", label: "All products" }}
    >
      {products.length === 0 ? (
        <PanelEmpty text="No sales recorded yet" />
      ) : (
        <ul className="space-y-4">
          {products.map((product, index) => {
            const tone = tones[rankTones[index % rankTones.length]];
            return (
              <li key={product.id}>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${tone.soft}`}
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-50">
                        {product.name}
                      </p>
                      {product.sku && (
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{product.sku}</p>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-50">
                      {formatNumber(product.units)} sold
                    </p>
                    {showMoney && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">{formatUGX(product.revenue)}</p>
                    )}
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                  <div
                    className={`h-full rounded-full ${tone.bar}`}
                    style={{ width: `${max > 0 ? (product.units / max) * 100 : 0}%` }}
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