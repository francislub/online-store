// components/backoffice/BannerList.jsx
// Route: /dashboard/banners  (list component)
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import TableActions from "@/components/backoffice/TableActions";
import { makeDeleteRequest, makePutRequest } from "@/lib/apiRequest";

const PLACEMENT_LABELS = {
  SLIDER: "Home Slider",
  TOP: "Top Right",
  BOTTOM: "Bottom Right",
};

const PLACEMENT_STYLES = {
  SLIDER: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  TOP: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  BOTTOM: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
};

function formatDate(value) {
  try {
    return new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

function csvCell(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export default function BannerList() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const fetchBanners = useCallback(async (q = "") => {
    try {
      setLoading(true);
      setErrorMessage("");
      const res = await fetch(`/api/banners?q=${encodeURIComponent(q)}`, { cache: "no-store" });
      const json = await res.json().catch(() => null);
      console.log("[BannerList] fetched", res.status, json);

      if (!res.ok) {
        setErrorMessage(json?.message || "Failed to load banners");
        setBanners([]);
        return;
      }
      setBanners(json.data || []);
      setSelected([]);
    } catch (err) {
      console.log(err);
      setErrorMessage("Network error, please try again");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners(search);
  }, [search, fetchBanners]);

  const allSelected = useMemo(
    () => banners.length > 0 && selected.length === banners.length,
    [banners, selected]
  );

  const toggleAll = () => setSelected(allSelected ? [] : banners.map((b) => b.id));
  const toggleOne = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  async function handleBulkDelete() {
    if (selected.length === 0) return;
    if (!window.confirm(`Delete ${selected.length} selected banner(s)? This cannot be undone.`)) return;

    const result = await makeDeleteRequest(
      setDeleting,
      "api/banners",
      { ids: selected },
      "Selected banners deleted"
    );
    if (result) fetchBanners(search);
  }

  async function handleDeleteOne(banner) {
    if (!window.confirm(`Delete banner "${banner.title}"?`)) return;
    setBusyId(banner.id);
    const result = await makeDeleteRequest(() => {}, `api/banners/${banner.id}`, null, "Banner deleted");
    setBusyId(null);
    if (result) fetchBanners(search);
  }

  async function handleToggleActive(banner) {
    setBusyId(banner.id);
    const result = await makePutRequest(
      () => {},
      `api/banners/${banner.id}`,
      { isActive: !banner.isActive },
      "Banner"
    );
    setBusyId(null);
    if (result) {
      setBanners((prev) => prev.map((b) => (b.id === banner.id ? { ...b, isActive: !banner.isActive } : b)));
    }
  }

  function handleExport() {
    if (banners.length === 0) {
      toast.error("No banners to export");
      return;
    }
    setExporting(true);
    try {
      const header = [
        "Title",
        "Subtitle",
        "Button Text",
        "Link",
        "Placement",
        "Image URL",
        "Sort Order",
        "Status",
        "Created",
      ];
      const rows = banners.map((b) => [
        b.title,
        b.subtitle || "",
        b.ctaLabel || "",
        b.link || "",
        PLACEMENT_LABELS[b.placement] || b.placement,
        b.imageUrl,
        b.sortOrder,
        b.isActive ? "Active" : "Inactive",
        formatDate(b.createdAt),
      ]);
      const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "banners.csv";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <TableActions
        searchValue={search}
        placeholder="Search banners by title, subtitle or link"
        onSearch={setSearch}
        onExport={handleExport}
        onBulkDelete={handleBulkDelete}
        selectedCount={selected.length}
        exporting={exporting}
        deleting={deleting}
      />

      <div className="py-8">
        <div className="relative overflow-x-auto rounded-lg shadow-md">
          <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th className="p-4">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Select all"
                    className="h-4 w-4 rounded border-gray-300 text-lime-600 focus:ring-lime-500"
                  />
                </th>
                <th className="px-6 py-3">Image</th>
                <th className="px-6 py-3">Title</th>
                <th className="px-6 py-3">Placement</th>
                <th className="px-6 py-3">Link</th>
                <th className="px-6 py-3">Order</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Created</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading banners...
                    </span>
                  </td>
                </tr>
              )}

              {!loading && errorMessage && (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center text-red-600">
                    {errorMessage}{" "}
                    <button onClick={() => fetchBanners(search)} className="underline">
                      Retry
                    </button>
                  </td>
                </tr>
              )}

              {!loading && !errorMessage && banners.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center">
                    {search ? "No banners match your search." : "No banners yet. Click “Add Banner” to create one."}
                  </td>
                </tr>
              )}

              {!loading &&
                banners.map((banner) => (
                  <tr
                    key={banner.id}
                    className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-600"
                  >
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selected.includes(banner.id)}
                        onChange={() => toggleOne(banner.id)}
                        aria-label={`Select ${banner.title}`}
                        className="h-4 w-4 rounded border-gray-300 text-lime-600 focus:ring-lime-500"
                      />
                    </td>
                    <td className="px-6 py-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={banner.imageUrl}
                        alt={banner.title}
                        className="h-12 w-24 rounded-md object-cover"
                      />
                    </td>
                    <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">
                      {banner.title}
                      {banner.subtitle && (
                        <span className="block max-w-[220px] truncate text-xs font-normal text-gray-500">
                          {banner.subtitle}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          PLACEMENT_STYLES[banner.placement] || PLACEMENT_STYLES.SLIDER
                        }`}
                      >
                        {PLACEMENT_LABELS[banner.placement] || banner.placement}
                      </span>
                    </td>
                    <td className="max-w-[200px] truncate px-6 py-3">{banner.link || "—"}</td>
                    <td className="px-6 py-3">{banner.sortOrder}</td>
                    <td className="px-6 py-3">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(banner)}
                        disabled={busyId === banner.id}
                        title="Click to toggle"
                        className={`rounded-full px-3 py-1 text-xs font-medium disabled:opacity-50 ${
                          banner.isActive
                            ? "bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-300"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-200"
                        }`}
                      >
                        {banner.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-6 py-3">{formatDate(banner.createdAt)}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/dashboard/banners/update/${banner.id}`}
                          className="inline-flex items-center gap-1 font-medium text-lime-700 hover:underline dark:text-lime-400"
                        >
                          <Pencil className="h-4 w-4" /> Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDeleteOne(banner)}
                          disabled={busyId === banner.id}
                          className="inline-flex items-center gap-1 font-medium text-red-600 hover:underline disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}