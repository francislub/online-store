// src/components/frontend/OrdersList.jsx
// Route: /account/orders
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { formatUGX } from "@/context/CartContext";

export const STATUS_STYLES = {
  PENDING: "bg-amber-100 text-amber-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  SHIPPED: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-200 text-gray-700",
};

export const fmtDate = (v) =>
  new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export default function OrdersList() {
  const [state, setState] = useState({ loading: true, orders: [], error: "", unauth: false });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/storefront/orders", { cache: "no-store" });
        const json = await res.json().catch(() => null);
        if (cancelled) return;
        if (res.status === 401) return setState({ loading: false, orders: [], error: "", unauth: true });
        if (!res.ok) return setState({ loading: false, orders: [], error: json?.message || "Failed to load", unauth: false });
        setState({ loading: false, orders: json.data || [], error: "", unauth: false });
      } catch {
        if (!cancelled) setState({ loading: false, orders: [], error: "Network error", unauth: false });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const { loading, orders, error, unauth } = state;

  if (loading) return <div className="h-48 animate-pulse rounded-xl bg-gray-200" />;

  if (unauth)
    return (
      <div className="rounded-xl bg-white p-10 text-center shadow-sm">
        <p className="text-gray-700">Please sign in to see your orders.</p>
        <Link href="/login?callbackUrl=%2Faccount%2Forders" className="mt-4 inline-block rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700">
          Sign in
        </Link>
      </div>
    );

  if (error) return <p className="text-red-600">{error}</p>;

  if (orders.length === 0)
    return (
      <div className="rounded-xl bg-white p-10 text-center shadow-sm">
        <p className="text-gray-700">You have not placed any orders yet.</p>
        <Link href="/products" className="mt-4 inline-block rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700">
          Start shopping
        </Link>
      </div>
    );

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm">
      <ul className="divide-y divide-gray-200">
        {orders.map((o) => (
          <li key={o.id}>
            <Link href={`/account/orders/${o.orderNumber}`} className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-gray-50 sm:p-5">
              <div>
                <p className="font-semibold text-gray-900">{o.orderNumber}</p>
                <p className="text-sm text-gray-500">
                  {fmtDate(o.createdAt)} · {o.itemCount} item{o.itemCount === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[o.status] || ""}`}>{o.status}</span>
                <span className="font-bold text-blue-600">{formatUGX(o.total)}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}