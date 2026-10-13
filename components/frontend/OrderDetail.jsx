// src/components/frontend/OrderDetail.jsx
// Route: /account/orders/:orderNumber  (?placed=1 shows the thank-you banner)
"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { formatUGX } from "@/context/CartContext";
import { STATUS_STYLES, fmtDate } from "./OrdersList";

const PLACEHOLDER = "/images/placeholder.png";

export default function OrderDetail({ orderNumber }) {
  const placed = useSearchParams().get("placed") === "1";
  const [state, setState] = useState({ loading: true, order: null, error: "", unauth: false });
  const [cancelling, setCancelling] = useState(false);
  const [actionError, setActionError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/storefront/orders/${orderNumber}`, { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (res.status === 401) return setState({ loading: false, order: null, error: "", unauth: true });
      if (!res.ok) return setState({ loading: false, order: null, error: json?.message || "Order not found", unauth: false });
      setState({ loading: false, order: json.data, error: "", unauth: false });
    } catch {
      setState({ loading: false, order: null, error: "Network error", unauth: false });
    }
  }, [orderNumber]);

  useEffect(() => {
    load();
  }, [load]);

  async function cancel() {
    if (!window.confirm("Cancel this order?")) return;
    setCancelling(true);
    setActionError("");
    try {
      const res = await fetch(`/api/storefront/orders/${orderNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) setActionError(json?.message || "Could not cancel");
      else await load();
    } finally {
      setCancelling(false);
    }
  }

  const { loading, order, error, unauth } = state;

  if (loading) return <div className="h-64 animate-pulse rounded-xl bg-gray-200" />;
  if (unauth)
    return (
      <div className="rounded-xl bg-white p-10 text-center shadow-sm">
        <p className="text-gray-700">Please sign in to view this order.</p>
        <Link href={`/login?callbackUrl=${encodeURIComponent(`/account/orders/${orderNumber}`)}`} className="mt-4 inline-block rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700">
          Sign in
        </Link>
      </div>
    );
  if (error || !order)
    return (
      <div className="rounded-xl bg-white p-10 text-center shadow-sm">
        <p className="text-gray-700">{error || "Order not found"}</p>
        <Link href="/account/orders" className="mt-4 inline-block text-blue-600 underline">Back to my orders</Link>
      </div>
    );

  const payment = order.payments?.[0];

  return (
    <div className="space-y-5">
      {placed && (
        <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-5">
          <CheckCircle2 className="mt-0.5 shrink-0 text-green-600" />
          <div>
            <p className="font-semibold text-green-900">Thank you! Your order has been received.</p>
            <p className="text-sm text-green-800">A confirmation email is on its way. We will contact you to confirm delivery.</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Order {order.orderNumber}</h2>
          <p className="text-sm text-gray-500">Placed on {fmtDate(order.createdAt)}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${STATUS_STYLES[order.status] || ""}`}>{order.status}</span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <ul className="divide-y divide-gray-200">
            {order.items.map((i) => (
              <li key={i.id} className="flex gap-4 p-4">
                <div className="h-16 w-16 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={i.product?.imageUrls?.[0] || PLACEHOLDER} alt={i.product?.name || "Item"} className="h-full w-full object-contain" />
                </div>
                <div className="min-w-0 flex-1">
                  {i.product?.slug ? (
                    <Link href={`/product/${i.product.slug}`} className="font-semibold text-gray-900 hover:text-blue-600">{i.product.name}</Link>
                  ) : (
                    <p className="font-semibold text-gray-900">Item</p>
                  )}
                  <p className="text-sm text-gray-500">{i.quantity} × {formatUGX(i.unitPrice)}</p>
                </div>
                <p className="shrink-0 font-bold text-gray-900">{formatUGX(i.total)}</p>
              </li>
            ))}
          </ul>
        </div>

        <aside className="h-fit space-y-4 rounded-xl bg-white p-6 shadow-sm text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-semibold">{formatUGX(order.subtotal)}</span></div>
          {order.discount > 0 && (
            <div className="flex justify-between text-green-700"><span>Discount{order.coupon ? ` (${order.coupon.couponCode})` : ""}</span><span>- {formatUGX(order.discount)}</span></div>
          )}
          <div className="flex justify-between border-t border-gray-200 pt-3 text-lg font-bold"><span>Total</span><span className="text-blue-600">{formatUGX(order.total)}</span></div>

          <div className="border-t border-gray-200 pt-3">
            <p className="font-semibold text-gray-900">Payment</p>
            <p className="text-gray-600">{payment?.notes || "—"} · {payment?.status || "PENDING"}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900">Delivery</p>
            <p className="text-gray-600">{order.address}</p>
            <p className="text-gray-600">{order.phone}</p>
          </div>

          {actionError && <p className="text-red-600">{actionError}</p>}
          {order.status === "PENDING" && (
            <button onClick={cancel} disabled={cancelling} className="w-full rounded-md border border-red-200 py-2.5 font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60">
              {cancelling ? "Cancelling..." : "Cancel order"}
            </button>
          )}
        </aside>
      </div>

      <Link href="/account/orders" className="inline-block text-sm font-semibold text-blue-600 hover:underline">← All my orders</Link>
    </div>
  );
}