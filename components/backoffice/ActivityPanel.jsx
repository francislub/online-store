// components/backoffice/ActivityPanel.jsx
import { Activity } from "lucide-react";
import Panel, { PanelEmpty } from "./Panel";
import { formatDateTime } from "@/lib/format";

export default function ActivityPanel({ items }) {
  return (
    <Panel
      title="Recent Activity"
      subtitle="Latest staff actions"
      icon={Activity}
      tone="purple"
      action={{ href: "/dashboard/audit-logs", label: "Audit log" }}
    >
      {items.length === 0 ? (
        <PanelEmpty text="No activity has been logged yet" />
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.id} className="flex gap-3">
              <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-violet-500 dark:bg-violet-400" />
              <div className="min-w-0">
                <p className="text-sm text-slate-700 dark:text-slate-200">
                  <span className="font-semibold">{item.actor?.name || "System"}</span>{" "}
                  <span className="lowercase">{item.action}</span>{" "}
                  <span className="font-medium">{item.entity}</span>
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{formatDateTime(item.createdAt)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}