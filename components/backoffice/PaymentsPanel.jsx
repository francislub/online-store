// components/backoffice/PaymentsPanel.jsx
import { CreditCard } from "lucide-react";
import Panel, { PanelEmpty } from "./Panel";
import { methodMeta, tones } from "./dashboardTones";
import { formatNumber, formatUGX } from "@/lib/format";

export default function PaymentsPanel({ total, count, byMethod }) {
  const max = Math.max(...byMethod.map((item) => item.total), 0);

  return (
    <Panel
      title="Payments This Month"
      subtitle={`${formatNumber(count)} payments received`}
      icon={CreditCard}
      tone="teal"
      action={{ href: "/dashboard/payments", label: "View all" }}
    >
      <p className="mb-4 text-2xl font-bold text-slate-800 dark:text-slate-50">{formatUGX(total)}</p>
      {byMethod.length === 0 ? (
        <PanelEmpty text="No payments recorded this month" />
      ) : (
        <ul className="space-y-4">
          {byMethod.map((item) => {
            const meta = methodMeta[item.method] || { label: item.method, tone: "slate" };
            const tone = tones[meta.tone];
            return (
              <li key={item.method}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-200">{meta.label}</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-50">{formatUGX(item.total)}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                  <div
                    className={`h-full rounded-full ${tone.bar}`}
                    style={{ width: `${max > 0 ? (item.total / max) * 100 : 0}%` }}
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