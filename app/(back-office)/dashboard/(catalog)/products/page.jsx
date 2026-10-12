// Route: /dashboard/products
// File: src/app/(backoffice)/dashboard/products/page.jsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import PageHeader from "@/components/backoffice/PageHeader";
import TableActions from "@/components/backoffice/TableActions";
import { makeDeleteRequest, makeGetRequest } from "@/lib/apiRequest";

const money = (value) => `UGX ${Number(value ?? 0).toLocaleString()}`;

export default function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const data = await makeGetRequest(`/api/products?search=${encodeURIComponent(search)}`);
    setProducts(Array.isArray(data) ? data : []);
    setSelected([]);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const allSelected = products.length > 0 && selected.length === products.length;

  function toggleAll() {
    setSelected(allSelected ? [] : products.map((p) => p.id));
  }

  function toggleOne(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleDelete(product) {
    if (!window.confirm(`Delete product "${product.name}"?`)) return;
    const result = await makeDeleteRequest(setDeleting, `/api/products/${product.id}`, null, "Product deleted");
    if (result) loadProducts();
  }

  async function handleBulkDelete() {
    if (!window.confirm(`Delete ${selected.length} selected product(s)?`)) return;
    const result = await makeDeleteRequest(setDeleting, "/api/products", { ids: selected });
    if (result) loadProducts();
  }

  function handleExport() {
    setExporting(true);
    try {
      const header = ["Name", "SKU", "Barcode", "Category", "Brand", "Price", "Sale Price", "Cost Price", "Stock", "Reorder Level", "Active"];
      const rows = products.map((p) => [
        p.name,
        p.sku,
        p.barcode ?? "",
        p.category?.name ?? "",
        p.brand ?? "",
        p.price,
        p.salePrice ?? "",
        p.costPrice,
        p.stock,
        p.reorderLevel,
        p.isActive ? "Yes" : "No",
      ]);
      const csv = [header, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        .join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "products.csv";
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <PageHeader heading="Products" href="/dashboard/products/new" linkTitle="Add Product" />

      {/* Export, search, bulk delete */}
      <TableActions
        placeholder="Search products by name, SKU, barcode or brand"
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
              <th className="px-6 py-3">Product</th>
              <th className="px-6 py-3">Category</th>
              <th className="px-6 py-3">Price</th>
              <th className="px-6 py-3">Stock</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center">Loading...</td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center">No products found</td>
              </tr>
            ) : (
              products.map((product) => {
                const lowStock = product.stock <= product.reorderLevel;
                return (
                  <tr
                    key={product.id}
                    className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-600"
                  >
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selected.includes(product.id)}
                        onChange={() => toggleOne(product.id)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      {product.imageUrls?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.imageUrls[0]}
                          alt={product.name}
                          className="h-10 w-10 rounded object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded bg-gray-200 dark:bg-gray-600" />
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {product.name}
                        {product.isFeatured && (
                          <span className="ms-2 rounded bg-yellow-100 px-1.5 py-0.5 text-xs text-yellow-800">
                            Featured
                          </span>
                        )}
                      </div>
                      <div className="text-xs">SKU: {product.sku}</div>
                    </td>
                    <td className="px-6 py-4">{product.category?.name ?? "-"}</td>
                    <td className="px-6 py-4">
                      {product.salePrice ? (
                        <>
                          <div className="font-medium text-gray-900 dark:text-white">{money(product.salePrice)}</div>
                          <div className="text-xs line-through">{money(product.price)}</div>
                        </>
                      ) : (
                        money(product.price)
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={lowStock ? "font-semibold text-red-600" : ""}>{product.stock}</span>
                      {lowStock && <span className="ms-1 text-xs text-red-600">(low)</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded px-2.5 py-0.5 text-xs font-medium ${
                          product.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/dashboard/products/update/${product.id}`}
                          className="inline-flex items-center gap-1 font-medium text-lime-600 hover:underline"
                        >
                          <Pencil className="h-4 w-4" /> Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(product)}
                          className="inline-flex items-center gap-1 font-medium text-red-600 hover:underline"
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}