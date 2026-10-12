// Route: /dashboard/customers
// File: src/app/(backoffice)/dashboard/customers/page.jsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Pencil, Power, Trash2 } from "lucide-react";
import PageHeader from "@/components/backoffice/PageHeader";
import TableActions from "@/components/backoffice/TableActions";
import { makeDeleteRequest, makeGetRequest, makePutRequest } from "@/lib/apiRequest";

const money = (value) => `UGX ${Number(value ?? 0).toLocaleString()}`;
const fmtDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-";
const shownEmail = (email) => (email && !email.endsWith("@walkin.local") ? email : "");

const STATUSES = ["all", "active", "inactive"];

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [toggling, setToggling] = useState(false);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    const query = new URLSearchParams({ search });
    if (status !== "all") query.set("status", status);
    const data = await makeGetRequest(`/api/customers?${query.toString()}`);
    setCustomers(Array.isArray(data) ? data : []);
    setSelected([]);
    setLoading(false);
  }, [search, status]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const totals = useMemo(
    () => ({
      spent: customers.reduce((sum, c) => sum + (c.totalSpent ?? 0), 0),
      owed: customers.reduce((sum, c) => sum + (c.outstanding ?? 0), 0),
    }),
    [customers]
  );
  const allSelected = customers.length > 0 && selected.length === customers.length;

  function toggleAll() {
    setSelected(allSelected ? [] : customers.map((c) => c.id));
  }

  function toggleOne(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleDelete(customer) {
    if (!window.confirm(`Delete customer "${customer.name}"?`)) return;
    const result = await makeDeleteRequest(setDeleting, `/api/customers/${customer.id}`, null, "Customer deleted");
    if (result) loadCustomers();
  }

  async function handleBulkDelete() {
    if (!window.confirm(`Delete ${selected.length} selected customer(s)? Customers with history are skipped.`)) return;
    const result = await makeDeleteRequest(setDeleting, "/api/customers", { ids: selected });
    if (result) loadCustomers();
  }

  async function handleToggleActive(customer) {
    const result = await makePutRequest(
      setToggling,
      `/api/customers/${customer.id}`,
      { isActive: !customer.isActive },
      customer.isActive ? "Customer deactivated -" : "Customer activated -"
    );
    if (result) loadCustomers();
  }

  function handleExport() {
    setExporting(true);
    try {
      const header = ["Name", "Phone", "Email", "Status", "Orders", "Total Spent", "Outstanding", "Last Order", "Joined"];
      const rows = customers.map((c) => [
        c.name,
        c.phone ?? "",
        shownEmail(c.email),
        c.isActive ? "Active" : "Inactive",
        c.orderCount,
        c.totalSpent,
        c.outstanding,
        fmtDate(c.lastOrderAt),
        fmtDate(c.createdAt),
      ]);
      const csv = [header, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        .join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "customers.csv";
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <PageHeader heading="Customers" href="/dashboard/customers/new" linkTitle="New Customer" />

      <TableActions
        placeholder="Search customers by name, phone or email"
        onSearch={setSearch}
        onExport={handleExport}
        onBulkDelete={handleBulkDelete}
        selectedCount={selected.length}
        exporting={exporting}
        deleting={deleting}
      />

      {/* Status filter + totals */}
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium capitalize transition-colors ${
                status === s
                  ? "bg-lime-600 text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <div className="rounded-lg bg-white px-5 py-3 text-right shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
            <div className="text-xs text-gray-500">Total spent ({customers.length} customers)</div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">{money(totals.spent)}</div>
          </div>
          <div className="rounded-lg bg-white px-5 py-3 text-right shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
            <div className="text-xs text-gray-500">Customers owe us</div>
            <div className={`text-lg font-bold ${totals.owed > 0 ? "text-red-600" : "text-gray-900 dark:text-white"}`}>{money(totals.owed)}</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="relative mt-4 overflow-x-auto rounded-lg shadow-md">
        <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
          <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th className="p-4">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              </th>
              <th className="px-6 py-3">Customer</th>
              <th className="px-6 py-3">Contact</th>
              <th className="px-6 py-3">Orders</th>
              <th className="px-6 py-3">Total spent</th>
              <th className="px-6 py-3">Owes</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center">Loading...</td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center">No customers found</td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr
                  key={customer.id}
                  className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-600"
                >
                  <td className="p-4">
                    <input type="checkbox" checked={selected.includes(customer.id)} onChange={() => toggleOne(customer.id)} />
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/dashboard/customers/${customer.id}`} className="font-medium text-gray-900 hover:text-lime-700 dark:text-white">
                      {customer.name}
                    </Link>
                    <div className="text-xs">Joined {fmtDate(customer.createdAt)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div>{customer.phone ?? "-"}</div>
                    {shownEmail(customer.email) && <div className="max-w-[14rem] truncate text-xs">{shownEmail(customer.email)}</div>}
                  </td>
                  <td className="px-6 py-4">
                    {customer.orderCount}
                    {customer.lastOrderAt && <div className="text-xs">Last {fmtDate(customer.lastOrderAt)}</div>}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{money(customer.totalSpent)}</td>
                  <td className={`px-6 py-4 font-medium ${customer.outstanding > 0 ? "text-red-600" : ""}`}>
                    {customer.outstanding > 0 ? money(customer.outstanding) : "-"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        customer.isActive ? "bg-lime-100 text-lime-800" : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {customer.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <Link href={`/dashboard/customers/${customer.id}`} className="inline-flex items-center gap-1 font-medium text-slate-600 hover:underline dark:text-slate-300">
                        <Eye className="h-4 w-4" /> View
                      </Link>
                      <Link href={`/dashboard/customers/update/${customer.id}`} className="inline-flex items-center gap-1 font-medium text-lime-600 hover:underline">
                        <Pencil className="h-4 w-4" /> Edit
                      </Link>
                      <button
                        type="button"
                        disabled={toggling}
                        onClick={() => handleToggleActive(customer)}
                        className="inline-flex items-center gap-1 font-medium text-amber-600 hover:underline disabled:opacity-50"
                      >
                        <Power className="h-4 w-4" /> {customer.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(customer)}
                        className="inline-flex items-center gap-1 font-medium text-red-600 hover:underline"
                      >
                        <Trash2 className="h-4 w-4" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}