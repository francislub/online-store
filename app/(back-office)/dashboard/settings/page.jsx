// Route: /dashboard/settings
// File: src/app/(backoffice)/dashboard/settings/page.jsx
"use client";

import React, { useEffect, useState } from "react";
import { RefreshCw, Save } from "lucide-react";
import { CATEGORIES } from "@/lib/activityConfig";
import { makeGetRequest, makePutRequest } from "@/lib/apiRequest";

const SECTIONS = [
  {
    key: "company",
    title: "Business details",
    hint: "Shown on invoices, quotes and reports.",
    fields: [
      { name: "name", label: "Business name", type: "text" },
      { name: "location", label: "Address", type: "text" },
      { name: "phone", label: "Phone", type: "text" },
      { name: "email", label: "Email", type: "email" },
      { name: "tin", label: "TIN", type: "text" },
    ],
  },
  {
    key: "sales",
    title: "Sales & tax",
    hint: "Defaults used when creating orders, invoices and quotes.",
    fields: [
      { name: "currency", label: "Currency", type: "text" },
      { name: "taxRate", label: "Tax rate (%)", type: "number" },
      { name: "invoiceDueDays", label: "Invoice due after (days)", type: "number" },
      { name: "quoteValidDays", label: "Quote valid for (days)", type: "number" },
    ],
  },
  {
    key: "inventory",
    title: "Inventory",
    hint: "Default for new products.",
    fields: [{ name: "defaultReorderLevel", label: "Default reorder level", type: "number" }],
  },
];

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const data = await makeGetRequest("/api/settings");
    if (data) setSettings(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function setField(section, name, value) {
    setSettings((prev) => ({ ...prev, [section]: { ...prev[section], [name]: value } }));
  }

  function toggleCategory(key) {
    setSettings((prev) => {
      const disabled = prev.notifications.disabled ?? [];
      return {
        ...prev,
        notifications: {
          ...prev.notifications,
          disabled: disabled.includes(key) ? disabled.filter((k) => k !== key) : [...disabled, key],
        },
      };
    });
  }

  async function save(e) {
    e.preventDefault();
    const payload = {
      ...settings,
      sales: {
        ...settings.sales,
        taxRate: Number(settings.sales.taxRate),
        invoiceDueDays: Number(settings.sales.invoiceDueDays),
        quoteValidDays: Number(settings.sales.quoteValidDays),
      },
      inventory: {
        ...settings.inventory,
        defaultReorderLevel: Number(settings.inventory.defaultReorderLevel),
      },
    };
    await makePutRequest(setSaving, "/api/settings", { settings: payload }, "Settings");
  }

  const input =
    "mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-lime-500 focus:ring-lime-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white";
  const card = "mb-6 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700";

  if (loading && !settings) return <p className="p-6 text-center">Loading settings...</p>;
  if (!settings) return <p className="p-6 text-center">Could not load settings</p>;

  const disabled = settings.notifications.disabled ?? [];

  return (
    <form onSubmit={save}>
      <div className={`${card} flex flex-wrap items-center justify-between gap-3`}>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Settings</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={load}
            disabled={loading || saving}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Reset
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-lime-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-lime-700 focus:outline-none focus:ring-4 focus:ring-lime-300 disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>

      {SECTIONS.map((section) => (
        <div key={section.key} className={card}>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">{section.title}</h2>
          <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">{section.hint}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {section.fields.map((f) => (
              <label key={f.name} className="text-sm text-gray-700 dark:text-gray-300">
                {f.label}
                <input
                  type={f.type}
                  step={f.type === "number" ? "any" : undefined}
                  min={f.type === "number" ? 0 : undefined}
                  value={settings[section.key][f.name] ?? ""}
                  onChange={(e) => setField(section.key, f.name, e.target.value)}
                  required={f.name === "name"}
                  className={input}
                />
              </label>
            ))}
          </div>
        </div>
      ))}

      <div className={card}>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Notifications</h2>
        <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
          Choose which system activities create notifications. Turning a category off does not stop the audit log.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.entries(CATEGORIES).map(([key, c]) => (
            <label key={key} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={!disabled.includes(key)}
                onChange={() => toggleCategory(key)}
                className="h-4 w-4 rounded border-gray-300 text-lime-600 focus:ring-lime-500"
              />
              {c.label}
            </label>
          ))}
        </div>
      </div>
    </form>
  );
}