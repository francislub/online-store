// components/backoffice/RecentCustomersPanel.jsx
import { Users } from "lucide-react";
import Panel, { PanelEmpty } from "./Panel";
import { formatDate, formatNumber } from "@/lib/format";

export default function RecentCustomersPanel({ customers, total }) {
  return (
    <Panel
      title="New Customers"
      subtitle={`${formatNumber(total)} registered in total`}
      icon={Users}
      tone="blue"
      action={{ href: "/dashboard/customers", label: "View all" }}
    >
      {customers.length === 0 ? (
        <PanelEmpty text="No customers have registered yet" />
      ) : (
        <ul className="space-y-4">
          {customers.map((customer) => (
            <li key={customer.id} className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
                {customer.name?.charAt(0).toUpperCase() || "C"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-50">{customer.name}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {customer.email}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(customer.createdAt)}</p>
                {!customer.isActive && (
                  <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">Inactive</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}