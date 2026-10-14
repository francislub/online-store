"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { Eye, Pencil, Power, Trash2 } from "lucide-react";

import PageHeader from "@/components/backoffice/PageHeader";
import TableActions from "@/components/backoffice/TableActions";
import {
  makeDeleteRequest,
  makeGetRequest,
  makePutRequest,
} from "@/lib/apiRequest";

/* =========================
   Type Definitions
========================= */

type Customer = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  orderCount: number;
  totalSpent: number;
  outstanding: number;
  lastOrderAt: string | Date | null;
  createdAt: string | Date;
};

type CustomerStatus = "all" | "active" | "inactive";

/* =========================
   Helper Functions
========================= */

const money = (value: number | string | null | undefined): string =>
  `UGX ${Number(value ?? 0).toLocaleString()}`;

const fmtDate = (
  value: string | Date | null | undefined
): string => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const shownEmail = (
  email: string | null | undefined
): string => {
  return email && !email.endsWith("@walkin.local")
    ? email
    : "";
};

const STATUSES: CustomerStatus[] = [
  "all",
  "active",
  "inactive",
];

/* =========================
   Customers Page
========================= */

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState<string>("");
  const [status, setStatus] = useState<CustomerStatus>("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);
  const [toggling, setToggling] = useState<boolean>(false);

  /* =========================
     Load Customers
  ========================= */

  const loadCustomers = useCallback(async () => {
    setLoading(true);

    try {
      const query = new URLSearchParams({ search });

      if (status !== "all") {
        query.set("status", status);
      }

      const data = await makeGetRequest(
        `/api/customers?${query.toString()}`
      );

      setCustomers(
        Array.isArray(data) ? (data as Customer[]) : []
      );

      setSelected([]);
    } catch (error) {
      console.error(
        "[Customers] Failed to load customers:",
        error
      );

      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  /* =========================
     Customer Totals
  ========================= */

  const totals = useMemo(
    () => ({
      spent: customers.reduce(
        (sum, customer) =>
          sum + Number(customer.totalSpent ?? 0),
        0
      ),

      owed: customers.reduce(
        (sum, customer) =>
          sum + Number(customer.outstanding ?? 0),
        0
      ),
    }),
    [customers]
  );

  const allSelected =
    customers.length > 0 &&
    selected.length === customers.length;

  /* =========================
     Selection
  ========================= */

  function toggleAll(): void {
    setSelected(
      allSelected
        ? []
        : customers.map((customer) => customer.id)
    );
  }

  function toggleOne(id: string): void {
    setSelected((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  }

  /* =========================
     Delete Customer
  ========================= */

  async function handleDelete(
    customer: Customer
  ): Promise<void> {
    if (
      !window.confirm(
        `Delete customer "${customer.name}"?`
      )
    ) {
      return;
    }

    const result = await makeDeleteRequest(
      setDeleting,
      `/api/customers/${customer.id}`,
      null,
      "Customer deleted"
    );

    if (result) {
      await loadCustomers();
    }
  }

  /* =========================
     Bulk Delete
  ========================= */

  async function handleBulkDelete(): Promise<void> {
    if (selected.length === 0) {
      return;
    }

    if (
      !window.confirm(
        `Delete ${selected.length} selected customer(s)? Customers with history are skipped.`
      )
    ) {
      return;
    }

    const result = await makeDeleteRequest(
      setDeleting,
      "/api/customers",
      { ids: selected },
      "Customers deleted successfully"
    );

    if (result) {
      await loadCustomers();
    }
  }

  /* =========================
     Activate / Deactivate
  ========================= */

  async function handleToggleActive(
    customer: Customer
  ): Promise<void> {
    const result = await makePutRequest(
      setToggling,
      `/api/customers/${customer.id}`,
      {
        isActive: !customer.isActive,
      },
      customer.isActive
        ? "Customer deactivated"
        : "Customer activated"
    );

    if (result) {
      await loadCustomers();
    }
  }

  /* =========================
     Export Customers to CSV
  ========================= */

  function handleExport(): void {
    setExporting(true);

    try {
      const header = [
        "Name",
        "Phone",
        "Email",
        "Status",
        "Orders",
        "Total Spent",
        "Outstanding",
        "Last Order",
        "Joined",
      ];

      const rows: (string | number)[][] =
        customers.map((customer) => [
          customer.name,
          customer.phone ?? "",
          shownEmail(customer.email),
          customer.isActive ? "Active" : "Inactive",
          customer.orderCount,
          customer.totalSpent,
          customer.outstanding,
          fmtDate(customer.lastOrderAt),
          fmtDate(customer.createdAt),
        ]);

      const csv = [header, ...rows]
        .map((row) =>
          row
            .map(
              (cell) =>
                `"${String(cell ?? "").replace(/"/g, '""')}"`
            )
            .join(",")
        )
        .join("\n");

      const blob = new Blob(["\uFEFF", csv], {
        type: "text/csv;charset=utf-8;",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "customers.csv";

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(
        "[Customers] Failed to export customers:",
        error
      );
    } finally {
      setExporting(false);
    }
  }

  /* =========================
     Page UI
  ========================= */

  return (
    <div>
      {/* Page Header */}
      <PageHeader
        heading="Customers"
        href="/dashboard/customers/new"
        linkTitle="New Customer"
      />

      {/* Search, Export and Bulk Delete */}
      <TableActions
        placeholder="Search customers by name, phone or email"
        onSearch={setSearch}
        onExport={handleExport}
        onBulkDelete={handleBulkDelete}
        selectedCount={selected.length}
        exporting={exporting}
        deleting={deleting}
      />

      {/* Status Filter and Financial Totals */}
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setStatus(item)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium capitalize transition-colors ${
                status === item
                  ? "bg-lime-600 text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="rounded-lg bg-white px-5 py-3 text-right shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
            <div className="text-xs text-gray-500">
              Total spent ({customers.length} customers)
            </div>

            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {money(totals.spent)}
            </div>
          </div>

          <div className="rounded-lg bg-white px-5 py-3 text-right shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
            <div className="text-xs text-gray-500">
              Customers owe us
            </div>

            <div
              className={`text-lg font-bold ${
                totals.owed > 0
                  ? "text-red-600"
                  : "text-gray-900 dark:text-white"
              }`}
            >
              {money(totals.owed)}
            </div>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="relative mt-4 overflow-x-auto rounded-lg shadow-md">
        <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
          <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th className="p-4">
                <input
                  type="checkbox"
                  aria-label="Select all customers"
                  checked={allSelected}
                  onChange={toggleAll}
                  disabled={
                    loading || customers.length === 0
                  }
                />
              </th>

              <th className="px-6 py-3">Customer</th>
              <th className="px-6 py-3">Contact</th>
              <th className="px-6 py-3">Orders</th>
              <th className="px-6 py-3">Total spent</th>
              <th className="px-6 py-3">Owes</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-8 text-center"
                >
                  Loading customers...
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-8 text-center"
                >
                  No customers found.
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr
                  key={customer.id}
                  className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-600"
                >
                  {/* Selection */}
                  <td className="p-4">
                    <input
                      type="checkbox"
                      aria-label={`Select ${customer.name}`}
                      checked={selected.includes(
                        customer.id
                      )}
                      onChange={() =>
                        toggleOne(customer.id)
                      }
                    />
                  </td>

                  {/* Customer Details */}
                  <td className="px-6 py-4">
                    <Link
                      href={`/dashboard/customers/${customer.id}`}
                      className="font-medium text-gray-900 hover:text-lime-700 dark:text-white"
                    >
                      {customer.name}
                    </Link>

                    <div className="text-xs">
                      Joined {fmtDate(customer.createdAt)}
                    </div>
                  </td>

                  {/* Contact Information */}
                  <td className="px-6 py-4">
                    <div>{customer.phone ?? "-"}</div>

                    {shownEmail(customer.email) && (
                      <div className="max-w-[14rem] truncate text-xs">
                        {shownEmail(customer.email)}
                      </div>
                    )}
                  </td>

                  {/* Orders */}
                  <td className="px-6 py-4">
                    {customer.orderCount}

                    {customer.lastOrderAt && (
                      <div className="text-xs">
                        Last {fmtDate(customer.lastOrderAt)}
                      </div>
                    )}
                  </td>

                  {/* Total Spent */}
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    {money(customer.totalSpent)}
                  </td>

                  {/* Outstanding Balance */}
                  <td
                    className={`px-6 py-4 font-medium ${
                      customer.outstanding > 0
                        ? "text-red-600"
                        : ""
                    }`}
                  >
                    {customer.outstanding > 0
                      ? money(customer.outstanding)
                      : "-"}
                  </td>

                  {/* Customer Status */}
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        customer.isActive
                          ? "bg-lime-100 text-lime-800"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {customer.isActive
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap items-center justify-end gap-3">
                      <Link
                        href={`/dashboard/customers/${customer.id}`}
                        className="inline-flex items-center gap-1 font-medium text-slate-600 hover:underline dark:text-slate-300"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Link>

                      <Link
                        href={`/dashboard/customers/update/${customer.id}`}
                        className="inline-flex items-center gap-1 font-medium text-lime-600 hover:underline"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Link>

                      <button
                        type="button"
                        disabled={toggling}
                        onClick={() =>
                          void handleToggleActive(customer)
                        }
                        className="inline-flex items-center gap-1 font-medium text-amber-600 hover:underline disabled:opacity-50"
                      >
                        <Power className="h-4 w-4" />
                        {customer.isActive
                          ? "Deactivate"
                          : "Activate"}
                      </button>

                      <button
                        type="button"
                        disabled={deleting}
                        onClick={() =>
                          void handleDelete(customer)
                        }
                        className="inline-flex items-center gap-1 font-medium text-red-600 hover:underline disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
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