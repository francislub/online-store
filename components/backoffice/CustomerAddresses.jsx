// components/backoffice/CustomerAddresses.jsx
// Route: n/a (used on /dashboard/customers/[id]; add, edit, delete and set-default addresses)
"use client";

import React, { useState } from "react";
import { Loader2, MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { makeDeleteRequest, makePostRequest, makePutRequest } from "@/lib/apiRequest";

const inputClass =
  "block w-full rounded-lg border border-gray-300 bg-gray-50 p-2 text-sm text-gray-900 focus:border-lime-500 focus:ring-lime-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white";

const emptyForm = { label: "", phone: "", address: "", city: "", isDefault: false };

export default function CustomerAddresses({ customerId, defaultPhone = "", addresses = [], onChange }) {
  const [editingId, setEditingId] = useState(null); // null = closed, "new" = adding
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);

  const base = `/api/customers/${customerId}/addresses`;

  function openNew() {
    setForm({ ...emptyForm, phone: defaultPhone ?? "" });
    setEditingId("new");
  }

  function openEdit(a) {
    setForm({ label: a.label ?? "", phone: a.phone, address: a.address, city: a.city ?? "", isDefault: a.isDefault });
    setEditingId(a.id);
  }

  const close = () => setEditingId(null);
  const set = (key) => (e) =>
    setForm((p) => ({ ...p, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  async function handleSave(e) {
    e.preventDefault();
    if (!form.phone.trim() || !form.address.trim()) return;
    const result =
      editingId === "new"
        ? await makePostRequest(setSaving, base, form, "Address")
        : await makePutRequest(setSaving, `${base}/${editingId}`, form, "Address");
    if (result) {
      close();
      onChange?.();
    }
  }

  async function handleDelete(a) {
    if (!window.confirm("Delete this address?")) return;
    const result = await makeDeleteRequest(setBusy, `${base}/${a.id}`, null, "Address deleted");
    if (result) onChange?.();
  }

  async function makeDefault(a) {
    const result = await makePutRequest(setBusy, `${base}/${a.id}`, { isDefault: true }, "Default address");
    if (result) onChange?.();
  }

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">Addresses</h3>
        {editingId === null && (
          <button type="button" onClick={openNew} className="inline-flex items-center gap-1 text-sm font-medium text-lime-700 hover:underline">
            <Plus className="h-4 w-4" /> Add address
          </button>
        )}
      </div>

      {editingId !== null && (
        <form onSubmit={handleSave} className="mb-4 grid gap-3 rounded-lg border border-dashed border-slate-300 p-4 dark:border-slate-600 md:grid-cols-2">
          <input className={inputClass} placeholder="Label (Home, Office...)" value={form.label} onChange={set("label")} />
          <input className={inputClass} placeholder="Phone *" value={form.phone} onChange={set("phone")} />
          <input className={`${inputClass} md:col-span-2`} placeholder="Address *" value={form.address} onChange={set("address")} />
          <input className={inputClass} placeholder="City" value={form.city} onChange={set("city")} />
          <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={form.isDefault} onChange={set("isDefault")} className="h-4 w-4 rounded text-lime-600 focus:ring-lime-500" />
            Default address
          </label>
          <div className="flex justify-end gap-2 md:col-span-2">
            <button type="button" onClick={close} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-lime-600 px-4 py-2 text-sm font-medium text-white hover:bg-lime-700 disabled:opacity-60">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
            </button>
          </div>
        </form>
      )}

      {addresses.length === 0 ? (
        <p className="text-sm text-gray-500">No addresses saved yet.</p>
      ) : (
        <ul className="space-y-3">
          {addresses.map((a) => (
            <li key={a.id} className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <div className="flex gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-lime-600" />
                <div className="text-sm">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {a.label || "Address"}
                    {a.isDefault && (
                      <span className="ml-2 rounded-full bg-lime-100 px-2 py-0.5 text-xs font-medium text-lime-800">Default</span>
                    )}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    {a.address}
                    {a.city ? `, ${a.city}` : ""}
                  </div>
                  <div className="text-xs text-gray-500">{a.phone}</div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-sm">
                {!a.isDefault && (
                  <button type="button" disabled={busy} onClick={() => makeDefault(a)} className="inline-flex items-center gap-1 font-medium text-slate-600 hover:underline">
                    <Star className="h-4 w-4" /> Default
                  </button>
                )}
                <button type="button" onClick={() => openEdit(a)} className="inline-flex items-center gap-1 font-medium text-lime-600 hover:underline">
                  <Pencil className="h-4 w-4" /> Edit
                </button>
                <button type="button" disabled={busy} onClick={() => handleDelete(a)} className="inline-flex items-center gap-1 font-medium text-red-600 hover:underline">
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}