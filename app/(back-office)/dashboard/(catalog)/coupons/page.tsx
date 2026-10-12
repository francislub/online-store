// Route: /dashboard/coupons
// File: src/app/(backoffice)/dashboard/coupons/page.jsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import PageHeader from "@/components/backoffice/PageHeader";
import TableActions from "@/components/backoffice/TableActions";
import { makeDeleteRequest, makeGetRequest } from "@/lib/apiRequest";

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : "-";
}

function formatDiscount(coupon) {
  return coupon.discountType === "PERCENTAGE"
    ? `${coupon.discountValue}%`
    : `UGX ${Number(coupon.discountValue).toLocaleString()}`;
}

export default function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadCoupons = useCallback(async () => {
    setLoading(true);
    const data = await makeGetRequest(`/api/coupons?search=${encodeURIComponent(search)}`);
    setCoupons(Array.isArray(data) ? data : []);
    setSelected([]);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  const allSelected = coupons.length > 0 && selected.length === coupons.length;

  function toggleAll() {
    setSelected(allSelected ? [] : coupons.map((c) => c.id));
  }

  function toggleOne(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleDelete(coupon) {
    if (!window.confirm(`Delete coupon "${coupon.title}"?`)) return;
    const result = await makeDeleteRequest(setDeleting, `/api/coupons/${coupon.id}`, null, "Coupon deleted");
    if (result) loadCoupons();
  }

  async function handleBulkDelete() {
    if (!window.confirm(`Delete ${selected.length} selected coupon(s)?`)) return;
    const result = await makeDeleteRequest(setDeleting, "/api/coupons", { ids: selected });
    if (result) loadCoupons();
  }

  function handleExport() {
    setExporting(true);
    try {
      const header = ["Title", "Code", "Type", "Value", "Min Order", "Used", "Limit", "Expiry", "Active"];
      const rows = coupons.map((c) => [
        c.title,
        c.couponCode,
        c.discountType,
        c.discountValue,
        c.minOrderTotal,
        c.usedCount,
        c.usageLimit ?? "",
        formatDate(c.expiryDate),
        c.isActive ? "Yes" : "No",
      ]);
      const csv = [header, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        .join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "coupons.csv";
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <PageHeader heading="Coupons" href="/dashboard/coupons/new" linkTitle="Add Coupon" />

      {/* Export, search, bulk delete */}
      <TableActions
        placeholder="Search coupons by title or code"
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
              <th className="px-6 py-3">Title</th>
              <th className="px-6 py-3">Code</th>
              <th className="px-6 py-3">Discount</th>
              <th className="px-6 py-3">Used</th>
              <th className="px-6 py-3">Expiry</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center">Loading...</td>
              </tr>
            ) : coupons.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center">No coupons found</td>
              </tr>
            ) : (
              coupons.map((coupon) => (
                <tr key={coupon.id} className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-600">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selected.includes(coupon.id)}
                      onChange={() => toggleOne(coupon.id)}
                    />
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{coupon.title}</td>
                  <td className="px-6 py-4">{coupon.couponCode}</td>
                  <td className="px-6 py-4">{formatDiscount(coupon)}</td>
                  <td className="px-6 py-4">
                    {coupon.usedCount}
                    {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""}
                  </td>
                  <td className="px-6 py-4">{formatDate(coupon.expiryDate)}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded px-2.5 py-0.5 text-xs font-medium ${
                        coupon.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {coupon.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/dashboard/coupons/update/${coupon.id}`}
                        className="inline-flex items-center gap-1 font-medium text-lime-600 hover:underline"
                      >
                        <Pencil className="h-4 w-4" /> Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(coupon)}
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