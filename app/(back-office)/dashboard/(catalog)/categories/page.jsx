// Route: /dashboard/categories
// File: src/app/(backoffice)/dashboard/categories/page.jsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import PageHeader from "@/components/backoffice/PageHeader";
import TableActions from "@/components/backoffice/TableActions";
import { makeDeleteRequest, makeGetRequest } from "@/lib/apiRequest";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    const data = await makeGetRequest(`/api/categories?search=${encodeURIComponent(search)}`);
    setCategories(Array.isArray(data) ? data : []);
    setSelected([]);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const allSelected = categories.length > 0 && selected.length === categories.length;

  function toggleAll() {
    setSelected(allSelected ? [] : categories.map((c) => c.id));
  }

  function toggleOne(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleDelete(category) {
    if (!window.confirm(`Delete category "${category.name}"?`)) return;
    const result = await makeDeleteRequest(setDeleting, `/api/categories/${category.id}`, null, "Category deleted");
    if (result) loadCategories();
  }

  async function handleBulkDelete() {
    if (!window.confirm(`Delete ${selected.length} selected category(ies)?`)) return;
    const result = await makeDeleteRequest(setDeleting, "/api/categories", { ids: selected });
    if (result) loadCategories();
  }

  function handleExport() {
    setExporting(true);
    try {
      const header = ["Name", "Slug", "Parent", "Products", "Active", "Created"];
      const rows = categories.map((c) => [
        c.name,
        c.slug,
        c.parent?.name ?? "",
        c._count?.products ?? 0,
        c.isActive ? "Yes" : "No",
        new Date(c.createdAt).toLocaleDateString(),
      ]);
      const csv = [header, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        .join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "categories.csv";
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <PageHeader heading="Categories" href="/dashboard/categories/new" linkTitle="Add Category" />

      {/* Export, search, bulk delete */}
      <TableActions
        placeholder="Search categories by name or slug"
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
              <th className="px-6 py-3">Image</th>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Slug</th>
              <th className="px-6 py-3">Parent</th>
              <th className="px-6 py-3">Products</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center">Loading...</td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center">No categories found</td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr
                  key={category.id}
                  className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-600"
                >
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selected.includes(category.id)}
                      onChange={() => toggleOne(category.id)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    {category.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={category.imageUrl}
                        alt={category.name}
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-gray-200 dark:bg-gray-600" />
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{category.name}</td>
                  <td className="px-6 py-4">{category.slug}</td>
                  <td className="px-6 py-4">{category.parent?.name ?? "-"}</td>
                  <td className="px-6 py-4">{category._count?.products ?? 0}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded px-2.5 py-0.5 text-xs font-medium ${
                        category.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {category.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/dashboard/categories/update/${category.id}`}
                        className="inline-flex items-center gap-1 font-medium text-lime-600 hover:underline"
                      >
                        <Pencil className="h-4 w-4" /> Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(category)}
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