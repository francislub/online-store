// components/backoffice/CustomerForm.jsx
// Route: n/a (shared form used on /dashboard/customers/new and /dashboard/customers/update/[id])
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { makePostRequest, makePutRequest } from "@/lib/apiRequest";

const PLACEHOLDER_SUFFIX = "@walkin.local";

const inputClass =
  "block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-lime-500 focus:ring-lime-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400";
const labelClass = "mb-2 block text-sm font-medium text-gray-900 dark:text-white";

export default function CustomerForm({ customer }) {
  const router = useRouter();
  const isEdit = Boolean(customer);

  const [form, setForm] = useState({
    name: customer?.name ?? "",
    email: customer?.email?.endsWith(PLACEHOLDER_SUFFIX) ? "" : customer?.email ?? "",
    phone: customer?.phone ?? "",
    password: "",
    isActive: customer?.isActive ?? true,
    label: "",
    address: "",
    city: "",
  });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const set = (key) => (event) => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    if (!form.name.trim()) return setFormError("Customer name is required");
    if (!isEdit && !form.email.trim() && !form.phone.trim()) return setFormError("Provide a phone number or an email");
    if (form.password && form.password.length < 8) return setFormError("Password must be at least 8 characters");

    const redirect = () => {
      router.push("/dashboard/customers");
      router.refresh();
    };

    if (isEdit) {
      const payload = {
        name: form.name,
        phone: form.phone,
        isActive: form.isActive,
      };
      if (form.email.trim()) payload.email = form.email;
      if (form.password) payload.password = form.password;
      await makePutRequest(setLoading, `/api/customers/${customer.id}`, payload, "Customer", redirect);
      return;
    }

    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      password: form.password,
      isActive: form.isActive,
    };
    if (form.address.trim()) {
      payload.address = { label: form.label, address: form.address, city: form.city, phone: form.phone };
    }
    await makePostRequest(setLoading, "/api/customers", payload, "Customer", null, redirect);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
        {isEdit ? `Update ${customer.name}` : "New Customer"}
      </h2>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="name" className={labelClass}>Full name *</label>
            <input id="name" type="text" value={form.name} onChange={set("name")} className={inputClass} placeholder="Customer name" />
          </div>

          <div>
            <label htmlFor="phone" className={labelClass}>Phone</label>
            <input id="phone" type="tel" value={form.phone} onChange={set("phone")} className={inputClass} placeholder="07xx xxx xxx" />
          </div>

          <div>
            <label htmlFor="email" className={labelClass}>Email</label>
            <input id="email" type="email" value={form.email} onChange={set("email")} className={inputClass} placeholder="Optional for walk-in customers" />
          </div>

          <div>
            <label htmlFor="password" className={labelClass}>
              {isEdit ? "New password (leave blank to keep)" : "Password (optional, for online login)"}
            </label>
            <input id="password" type="password" value={form.password} onChange={set("password")} className={inputClass} placeholder="At least 8 characters" autoComplete="new-password" />
          </div>

          <div className="flex items-end">
            <label className="inline-flex cursor-pointer items-center gap-2 pb-2.5 text-sm font-medium text-gray-900 dark:text-white">
              <input type="checkbox" checked={form.isActive} onChange={set("isActive")} className="h-4 w-4 rounded border-gray-300 text-lime-600 focus:ring-lime-500" />
              Active customer
            </label>
          </div>
        </div>

        {!isEdit && (
          <div className="rounded-lg border border-dashed border-slate-300 p-4 dark:border-slate-600">
            <div className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Delivery address (optional)</div>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label htmlFor="label" className={labelClass}>Label</label>
                <input id="label" type="text" value={form.label} onChange={set("label")} className={inputClass} placeholder="Home, Office..." />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="address" className={labelClass}>Address</label>
                <input id="address" type="text" value={form.address} onChange={set("address")} className={inputClass} placeholder="Street, building, shop no." />
              </div>
              <div>
                <label htmlFor="city" className={labelClass}>City</label>
                <input id="city" type="text" value={form.city} onChange={set("city")} className={inputClass} placeholder="Kampala" />
              </div>
            </div>
          </div>
        )}

        {isEdit && (
          <p className="text-xs text-gray-500">Manage delivery addresses from the customer profile page.</p>
        )}

        {formError && <p className="text-sm font-medium text-red-600">{formError}</p>}

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push("/dashboard/customers")}
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-lime-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-lime-700 focus:outline-none focus:ring-4 focus:ring-lime-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? "Save changes" : "Create customer"}
          </button>
        </div>
      </form>
    </div>
  );
}