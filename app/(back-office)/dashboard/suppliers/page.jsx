// Route: /dashboard/suppliers
// File: src/app/(backoffice)/dashboard/suppliers/page.jsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import PageHeader from "@/components/backoffice/PageHeader";
import TableActions from "@/components/backoffice/TableActions";
import { makeDeleteRequest, makeGetRequest } from "@/lib/apiRequest";

const money = (value) => `UGX ${Number(value ?? 0).toLocaleString()}`;

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadSuppliers = useCallback(async () => {
    setLoading(true);
    const data = await makeGetRequest(`/api/suppliers?search=${encodeURIComponent(search)}`);
    setSuppliers(Array.isArray(data) ? data : []);
    setSelected([]);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  const allSelected = suppliers.length > 0 && selected.length === suppliers.length;

  function toggleAll() {
    setSelected(allSelected ? [] : suppliers.map((s) => s.id));
  }

  function toggleOne(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleDelete(supplier) {
    if (!window.confirm(`Delete supplier "${supplier.name}"?`)) return;
    const result = await makeDeleteRequest(setDeleting, `/api/suppliers/${supplier.id}`, null, "Supplier deleted");
    if (result) loadSuppliers();
  }

  async function handleBulkDelete() {
    if (!window.confirm(`Delete ${selected.length} selected supplier(s)?`)) return;
    const result = await makeDeleteRequest(setDeleting, "/api/suppliers", { ids: selected });
    if (result) loadSuppliers();
  }

  function handleExport() {
    setExporting(true);
    try {
      const header = ["Name", "Contact", "Phone", "Email", "Address", "Balance", "Active"];
      const rows = suppliers.map((s) => [
        s.name,
        s.contactName ?? "",
        s.phone ?? "",
        s.email ?? "",
        s.address ?? "",
        s.balance,
        s.isActive ? "Yes" : "No",
      ]);
      const csv = [header, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        .join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "suppliers.csv";
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <PageHeader heading="Suppliers" href="/dashboard/suppliers/new" linkTitle="Add Supplier" />

      {/* Export, search, bulk delete */}
      <TableActions
        placeholder="Search suppliers by name, contact, phone or email"
        onSearch={setSearch}
        onExport={handleExport}
        onBulkDelete={handleBulkDelete}
        selectedCount={selected.length}
        exporting={exporting}
        deleting={deleting}
      />

      {/* Table */}
      <div className="relative mt-6 overflow-x-auto rounded-lg shadow-md">
        <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
          <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th className="p-4">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              </th>
              <th className="px-6 py-3">Supplier</th>
              <th className="px-6 py-3">Contact</th>
              <th className="px-6 py-3">Balance Owed</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center">Loading...</td>
              </tr>
            ) : suppliers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center">No suppliers found</td>
              </tr>
            ) : (
              suppliers.map((supplier) => (
                <tr
                  key={supplier.id}
                  className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-600"
                >
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selected.includes(supplier.id)}
                      onChange={() => toggleOne(supplier.id)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 dark:text-white">{supplier.name}</div>
                    {supplier.address && <div className="text-xs">{supplier.address}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <div>{supplier.contactName ?? "-"}</div>
                    <div className="text-xs">{supplier.phone ?? supplier.email ?? ""}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={supplier.balance > 0 ? "font-semibold text-red-600" : ""}>
                      {money(supplier.balance)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded px-2.5 py-0.5 text-xs font-medium ${
                        supplier.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {supplier.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/dashboard/suppliers/update/${supplier.id}`}
                        className="inline-flex items-center gap-1 font-medium text-lime-600 hover:underline"
                      >
                        <Pencil className="h-4 w-4" /> Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(supplier)}
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