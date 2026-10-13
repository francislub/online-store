// Route: /dashboard/customers/[id]
// File: src/app/(backoffice)/dashboard/customers/[id]/page.jsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Mail, Pencil, Phone } from "lucide-react";
import StatusBadge from "@/components/backoffice/StatusBadge";
import CustomerAddresses from "@/components/backoffice/CustomerAddresses";
import { makeGetRequest } from "@/lib/apiRequest";

const money = (value) => `UGX ${Number(value ?? 0).toLocaleString()}`;
const fmtDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-";
const label = (s) => String(s ?? "").replace(/_/g, " ").toLowerCase();

function Stat({ title, value, sub, color = "text-gray-900 dark:text-white" }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</div>
      <div className={`mt-1 text-xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-gray-500">{sub}</div>}
    </div>
  );
}

export default function CustomerDetails() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const data = await makeGetRequest(`/api/customers/${id}`);
    setCustomer(data);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    if (id) load();
  }, [id, load]);

  if (loading) return <p className="p-6 text-center">Loading customer...</p>;
  if (!customer) return <p className="p-6 text-center">Customer not found</p>;

  const email = customer.email && !customer.email.endsWith("@walkin.local") ? customer.email : "";
  const stats = customer.stats ?? {};
  const orders = customer.orders ?? [];
  const payments = customer.payments ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/dashboard/customers" className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-lime-700">
            <ArrowLeft className="h-4 w-4" /> All customers
          </Link>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {customer.name}
            <span
              className={`ml-3 rounded-full px-2.5 py-0.5 align-middle text-xs font-medium ${
                customer.isActive ? "bg-lime-100 text-lime-800" : "bg-gray-200 text-gray-700"
              }`}
            >
              {customer.isActive ? "Active" : "Inactive"}
            </span>
          </h2>
          <div className="mt-1 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
            {customer.phone && (
              <span className="inline-flex items-center gap-1"><Phone className="h-4 w-4" /> {customer.phone}</span>
            )}
            {email && (
              <span className="inline-flex items-center gap-1"><Mail className="h-4 w-4" /> {email}</span>
            )}
            <span>Joined {fmtDate(customer.createdAt)}</span>
          </div>
        </div>
        <Link
          href={`/dashboard/customers/update/${customer.id}`}
          className="inline-flex items-center gap-2 rounded-lg bg-lime-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-lime-700"
        >
          <Pencil className="h-4 w-4" /> Edit customer
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat title="Orders" value={stats.orderCount ?? 0} sub={stats.lastOrderAt ? `Last ${fmtDate(stats.lastOrderAt)}` : "No orders yet"} />
        <Stat title="Total spent" value={money(stats.totalSpent)} />
        <Stat title="Total paid" value={money(stats.totalPaid)} color="text-lime-700" />
        <Stat title="Outstanding" value={money(stats.outstanding)} color={stats.outstanding > 0 ? "text-red-600" : undefined} sub="Unpaid invoices" />
      </div>

      <CustomerAddresses customerId={customer.id} defaultPhone={customer.phone} addresses={customer.addresses} onChange={load} />

      {/* Orders */}
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
        <h3 className="px-5 pt-5 text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">Recent orders</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th className="px-6 py-3">Order</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Invoice</th>
                <th className="px-6 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-6 text-center">No orders yet</td></tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="border-t dark:border-gray-700">
                    <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">
                      <Link href={`/dashboard/orders/${o.id}`} className="hover:text-lime-700">{o.orderNumber}</Link>
                    </td>
                    <td className="px-6 py-3">{fmtDate(o.createdAt)}</td>
                    <td className="px-6 py-3"><StatusBadge value={o.status} /></td>
                    <td className="px-6 py-3">
                      {o.invoices?.length ? (
                        <div className="space-y-1">
                          {o.invoices.map((inv) => (
                            <div key={inv.id}>
                              {inv.number} <span className="text-xs capitalize">({label(inv.status)})</span>
                              {inv.balance > 0 && <span className="ml-1 text-xs text-red-600">owes {money(inv.balance)}</span>}
                            </div>
                          ))}
                        </div>
                      ) : "-"}
                    </td>
                    <td className="px-6 py-3 text-right font-medium text-gray-900 dark:text-white">{money(o.total)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payments */}
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
        <h3 className="px-5 pt-5 text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">Recent payments</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th className="px-6 py-3">Reference</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Order</th>
                <th className="px-6 py-3">Method</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-6 text-center">No payments yet</td></tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="border-t dark:border-gray-700">
                    <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">{p.reference}</td>
                    <td className="px-6 py-3">{fmtDate(p.paidAt)}</td>
                    <td className="px-6 py-3">{p.order?.orderNumber ?? "-"}</td>
                    <td className="px-6 py-3 capitalize">{label(p.method)}</td>
                    <td className="px-6 py-3"><StatusBadge value={p.status} /></td>
                    <td className="px-6 py-3 text-right font-medium text-gray-900 dark:text-white">{money(p.amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}