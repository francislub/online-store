// Route: /dashboard/orders/[id]
// File: src/app/(backoffice)/dashboard/orders/[id]/page.jsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CreditCard, FileText, Pencil } from "lucide-react";
import PageHeader from "@/components/backoffice/PageHeader";
import StatusBadge from "@/components/backoffice/StatusBadge";
import { makeGetRequest, makePostRequest, makePutRequest } from "@/lib/apiRequest";
import { ORDER_TRANSITIONS, COUNTED_PAYMENT_STATUSES, prettify } from "@/lib/constants";
import { fmtDate, money } from "@/lib/format";

const card = "rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800";
const th = "px-4 py-3";

export default function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const data = await makeGetRequest(`/api/orders/${id}`);
    setOrder(data);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    if (id) load();
  }, [id, load]);

  if (loading) return <p className="p-6 text-center">Loading order...</p>;
  if (!order) return <p className="p-6 text-center">Order not found</p>;

  const paid = order.payments
    .filter((p) => COUNTED_PAYMENT_STATUSES.includes(p.status))
    .reduce((sum, p) => sum + p.amount, 0);
  const balance = Math.max(0, order.total - paid);
  const next = ORDER_TRANSITIONS[order.status] ?? [];
  const profit = order.items.reduce((sum, i) => sum + (i.unitPrice - i.costPrice) * i.quantity, 0) - order.discount;

  async function changeStatus(status) {
    let refund = false;
    if (status === "CANCELLED") {
      if (!window.confirm(`Cancel order ${order.orderNumber}? Stock goes back and the invoice is voided.`)) return;
      if (paid > 0) {
        refund = window.confirm(`${money(paid)} was paid on this order. Mark those payments as refunded?`);
        if (!refund) return;
      }
    } else if (!window.confirm(`Mark order as ${prettify(status)}?`)) {
      return;
    }
    const result = await makePutRequest(setBusy, `/api/orders/${id}`, { status, refund }, "Order");
    if (result) load();
  }

  async function createInvoice() {
    const result = await makePostRequest(setBusy, `/api/orders/${id}/invoice`, {}, "Invoice");
    if (result) load();
  }

  return (
    <div>
      <PageHeader heading={`Order ${order.orderNumber}`} href="/dashboard/orders/new" linkTitle="New Order" />

      {/* Actions */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <StatusBadge value={order.status} />
        <span className="text-sm text-gray-500">Placed {fmtDate(order.createdAt)}</span>
        <div className="ml-auto flex flex-wrap gap-2">
          {order.status !== "CANCELLED" && balance > 0 && (
            <Link href={`/dashboard/payments/new?orderId=${order.id}`} className="inline-flex items-center gap-1 rounded-lg bg-lime-600 px-4 py-2 text-sm font-medium text-white hover:bg-lime-700">
              <CreditCard className="h-4 w-4" /> Record payment
            </Link>
          )}
          {order.invoice ? (
            <Link href={`/dashboard/invoices/${order.invoice.id}`} className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <FileText className="h-4 w-4" /> Invoice {order.invoice.number}
            </Link>
          ) : (
            order.status !== "CANCELLED" && (
              <button type="button" disabled={busy} onClick={createInvoice} className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60">
                <FileText className="h-4 w-4" /> Create invoice
              </button>
            )
          )}
          {order.status !== "CANCELLED" && (
            <Link href={`/dashboard/orders/update/${order.id}`} className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Pencil className="h-4 w-4" /> Edit
            </Link>
          )}
        </div>
      </div>

      {/* Workflow */}
      {next.length > 0 && (
        <div className={`${card} mt-4 flex flex-wrap items-center gap-2`}>
          <span className="mr-2 text-sm font-medium text-gray-900 dark:text-white">Move order to:</span>
          {next.map((s) => (
            <button
              key={s}
              type="button"
              disabled={busy}
              onClick={() => changeStatus(s)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium capitalize disabled:opacity-60 ${
                s === "CANCELLED" ? "bg-red-50 text-red-700 ring-1 ring-red-200 hover:bg-red-100" : "bg-lime-50 text-lime-800 ring-1 ring-lime-200 hover:bg-lime-100"
              }`}
            >
              {prettify(s)}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Items */}
        <div className={`${card} lg:col-span-2`}>
          <h3 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">Items</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
              <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th className={th}>Product</th>
                  <th className={th}>Qty</th>
                  <th className={th}>Unit price</th>
                  <th className={`${th} text-right`}>Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b dark:border-gray-700">
                    <td className={th}>
                      <div className="font-medium text-gray-900 dark:text-white">{item.product?.name ?? "Deleted product"}</div>
                      <div className="text-xs">{item.product?.sku}</div>
                    </td>
                    <td className={th}>{item.quantity}</td>
                    <td className={th}>{money(item.unitPrice)}</td>
                    <td className={`${th} text-right font-medium text-gray-900 dark:text-white`}>{money(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 ml-auto max-w-xs space-y-1 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{money(order.subtotal)}</span></div>
            {order.tax > 0 && <div className="flex justify-between"><span>Tax</span><span>{money(order.tax)}</span></div>}
            {order.discount > 0 && (
              <div className="flex justify-between">
                <span>Discount{order.coupon ? ` (${order.coupon.couponCode})` : ""}</span>
                <span>- {money(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 text-base font-bold text-gray-900 dark:text-white"><span>Total</span><span>{money(order.total)}</span></div>
            <div className="flex justify-between text-lime-700"><span>Paid</span><span>{money(paid)}</span></div>
            <div className={`flex justify-between font-semibold ${balance > 0 ? "text-red-600" : "text-lime-700"}`}><span>Balance</span><span>{money(balance)}</span></div>
            <div className="flex justify-between pt-1 text-xs text-gray-500"><span>Estimated profit</span><span>{money(profit)}</span></div>
          </div>
        </div>

        {/* Customer */}
        <div className={card}>
          <h3 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">Customer & delivery</h3>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-xs text-gray-500">Customer</dt><dd className="font-medium text-gray-900 dark:text-white">{order.customer?.name ?? order.invoice?.customerName ?? "Walk-in"}</dd></div>
            {order.customer?.email && <div><dt className="text-xs text-gray-500">Email</dt><dd>{order.customer.email}</dd></div>}
            <div><dt className="text-xs text-gray-500">Phone</dt><dd>{order.phone}</dd></div>
            <div><dt className="text-xs text-gray-500">Address</dt><dd>{order.address}</dd></div>
            {order.notes && <div><dt className="text-xs text-gray-500">Notes</dt><dd className="whitespace-pre-wrap">{order.notes}</dd></div>}
          </dl>
        </div>
      </div>

      {/* Payments */}
      <div className={`${card} mt-4`}>
        <h3 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">Payments</h3>
        {order.payments.length === 0 ? (
          <p className="text-sm text-gray-500">No payments recorded yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
              <tbody>
                {order.payments.map((p) => (
                  <tr key={p.id} className="border-b last:border-0 dark:border-gray-700">
                    <td className={th}>{fmtDate(p.paidAt)}</td>
                    <td className={th}>
                      <Link href={`/dashboard/payments/update/${p.id}`} className="font-medium text-gray-900 hover:underline dark:text-white">{p.reference}</Link>
                    </td>
                    <td className={`${th} capitalize`}>{prettify(p.method)}</td>
                    <td className={th}><StatusBadge value={p.status} /></td>
                    <td className={`${th} text-right font-medium text-gray-900 dark:text-white`}>{money(p.amount)}</td>
                    <td className={th}>{p.recordedBy?.name ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Returns */}
      {order.returns.length > 0 && (
        <div className={`${card} mt-4`}>
          <h3 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">Returns</h3>
          <ul className="space-y-2 text-sm">
            {order.returns.map((r) => (
              <li key={r.id} className="flex items-center justify-between">
                <span>{r.reference} - {r.reason}</span>
                <span className="flex items-center gap-3">
                  <StatusBadge value={r.status} />
                  <span className="font-medium">{money(r.refundAmount)}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
