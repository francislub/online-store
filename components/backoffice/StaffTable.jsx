// components/backoffice/StaffTable.jsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import TableActions from "./TableActions";
import { tones } from "./dashboardTones";
import { STAFF_ROLE_MAP, STAFF_ROLE_OPTIONS } from "./staffRoles";
import { formatDate, formatNumber } from "@/lib/format";

function buildHref({ q, role, page }) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (role) params.set("role", role);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return `/dashboard/staff${query ? `?${query}` : ""}`;
}

function csvCell(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export default function StaffTable({ staff, total, page, pageSize, totalPages, query, roleFilter, currentUserId }) {
  const router = useRouter();
  const [selected, setSelected] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const selectable = staff.filter((member) => member.id !== currentUserId).map((member) => member.id);
  const allSelected = selectable.length > 0 && selectable.every((id) => selected.includes(id));
  const startIndex = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, total);
  const firstPage = Math.max(1, Math.min(page - 2, totalPages - 4));
  const lastPage = Math.min(totalPages, firstPage + 4);
  const pages = Array.from({ length: lastPage - firstPage + 1 }, (_, index) => firstPage + index);

  const filters = [{ value: "", label: "All" }, ...STAFF_ROLE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))];

  function toggleOne(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }

  function toggleAll() {
    setSelected(allSelected ? [] : selectable);
  }

  function handleSearch(value) {
    setSelected([]);
    router.replace(buildHref({ q: value, role: roleFilter, page: 1 }));
  }

  async function deleteIds(ids) {
    if (ids.length === 0) return;
    const message = `Delete ${ids.length} staff account${ids.length > 1 ? "s" : ""}? This cannot be undone.`;
    if (!window.confirm(message)) return;

    setDeleting(true);
    try {
      const response = await fetch("/api/staff", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || "Failed to delete staff");
        return;
      }

      if (result.deleted > 0) {
        toast.success(`${result.deleted} staff account${result.deleted > 1 ? "s" : ""} deleted`);
      }
      result.skipped.forEach((item) => toast.error(`${item.name}: ${item.reason}`));

      setSelected([]);
      router.refresh();
    } catch (error) {
      console.log(error);
      toast.error("Network error, please try again");
    } finally {
      setDeleting(false);
    }
  }

  async function exportCsv() {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (roleFilter) params.set("role", roleFilter);
      const response = await fetch(`/api/staff?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || "Failed to export staff");
        return;
      }

      const header = ["Name", "Email", "Phone", "Role", "Status", "Joined"];
      const rows = result.data.map((member) => [
        member.name,
        member.email,
        member.phone || "",
        STAFF_ROLE_MAP[member.role]?.label || member.role,
        member.isActive ? "Active" : "Inactive",
        formatDate(member.createdAt),
      ]);
      const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "green-planet-computers-staff.csv";
      link.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${rows.length} staff member${rows.length === 1 ? "" : "s"}`);
    } catch (error) {
      console.log(error);
      toast.error("Network error, please try again");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <TableActions
        searchValue={query}
        placeholder="Search by name, email or phone"
        onSearch={handleSearch}
        onExport={exportCsv}
        onBulkDelete={() => deleteIds(selected)}
        selectedCount={selected.length}
        exporting={exporting}
        deleting={deleting}
      />

      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => {
          const active = filter.value === roleFilter;
          return (
            <Link
              key={filter.label}
              href={buildHref({ q: query, role: filter.value, page: 1 })}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                active
                  ? "bg-lime-600 text-white dark:bg-lime-500 dark:text-slate-900"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
              }`}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-700/60 dark:text-slate-400">
            <tr>
              <th scope="col" className="w-4 p-4">
                <input
                  type="checkbox"
                  aria-label="Select all"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-gray-300 text-lime-600 focus:ring-lime-500 dark:border-gray-600 dark:bg-gray-700"
                />
              </th>
              <th scope="col" className="px-5 py-3">Staff Member</th>
              <th scope="col" className="px-5 py-3">Phone</th>
              <th scope="col" className="px-5 py-3">Role</th>
              <th scope="col" className="px-5 py-3">Status</th>
              <th scope="col" className="px-5 py-3">Joined</th>
              <th scope="col" className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {staff.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-slate-500 dark:text-slate-400">
                  No staff members found
                </td>
              </tr>
            )}
            {staff.map((member) => {
              const roleMeta = STAFF_ROLE_MAP[member.role];
              const isSelf = member.id === currentUserId;
              return (
                <tr key={member.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/40">
                  <td className="w-4 p-4">
                    <input
                      type="checkbox"
                      aria-label={`Select ${member.name}`}
                      disabled={isSelf}
                      checked={selected.includes(member.id)}
                      onChange={() => toggleOne(member.id)}
                      className="h-4 w-4 rounded border-gray-300 text-lime-600 focus:ring-lime-500 disabled:opacity-40 dark:border-gray-600 dark:bg-gray-700"
                    />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lime-100 text-sm font-bold text-lime-700 dark:bg-lime-500/15 dark:text-lime-300">
                        {member.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="whitespace-nowrap font-semibold text-slate-800 dark:text-slate-50">
                          {member.name}
                          {isSelf && (
                            <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                              You
                            </span>
                          )}
                        </p>
                        <p className="whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">{member.phone || "-"}</td>
                  <td className="px-5 py-4">
                    <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${tones[roleMeta.tone].chip}`}>
                      {roleMeta.label}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
                        member.isActive ? tones.green.chip : tones.red.chip
                      }`}
                    >
                      {member.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-xs">{formatDate(member.createdAt)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/dashboard/staff/update/${member.id}`}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-lime-700 hover:bg-lime-50 dark:text-lime-400 dark:hover:bg-lime-500/10"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Link>
                      <button
                        type="button"
                        disabled={isSelf || deleting}
                        onClick={() => deleteIds([member.id])}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-red-400 dark:hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <nav className="flex flex-col items-center justify-between gap-3 md:flex-row" aria-label="Table navigation">
        <span className="text-sm text-slate-500 dark:text-slate-400">
          Showing{" "}
          <span className="font-semibold text-slate-800 dark:text-slate-50">
            {formatNumber(startIndex)}-{formatNumber(endIndex)}
          </span>{" "}
          of <span className="font-semibold text-slate-800 dark:text-slate-50">{formatNumber(total)}</span> staff
        </span>

        <ul className="inline-flex items-center gap-1 text-sm">
          <li>
            {page > 1 ? (
              <Link
                href={buildHref({ q: query, role: roleFilter, page: page - 1 })}
                className="flex h-9 items-center gap-1 rounded-lg px-3 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </Link>
            ) : (
              <span className="flex h-9 items-center gap-1 rounded-lg px-3 text-slate-300 dark:text-slate-600">
                <ChevronLeft className="h-4 w-4" /> Previous
              </span>
            )}
          </li>
          {pages.map((number) => (
            <li key={number}>
              <Link
                href={buildHref({ q: query, role: roleFilter, page: number })}
                aria-current={number === page ? "page" : undefined}
                className={`flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg px-2 font-medium ${
                  number === page
                    ? "bg-lime-600 text-white dark:bg-lime-500 dark:text-slate-900"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                {number}
              </Link>
            </li>
          ))}
          <li>
            {page < totalPages ? (
              <Link
                href={buildHref({ q: query, role: roleFilter, page: page + 1 })}
                className="flex h-9 items-center gap-1 rounded-lg px-3 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Next <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className="flex h-9 items-center gap-1 rounded-lg px-3 text-slate-300 dark:text-slate-600">
                Next <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </li>
        </ul>
      </nav>
    </div>
  );
}