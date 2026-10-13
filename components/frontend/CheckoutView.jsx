// src/components/frontend/CheckoutView.jsx
// Route: /checkout
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart, formatUGX } from "@/context/CartContext";
import { useSessionUser } from "@/lib/useSessionUser";
import { PAYMENT_OPTIONS } from "@/lib/paymentOptions";

const inputCls =
  "w-full rounded-md border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

export default function CheckoutView() {
  const router = useRouter();
  const { items, subtotal, clear } = useCart();
  const { loading: sessionLoading, user } = useSessionUser();

  const [form, setForm] = useState({ name: "", phone: "", city: "", address: "", notes: "" });
  const [payment, setPayment] = useState("cod");
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState(null); // { code, title, discount }
  const [couponMsg, setCouponMsg] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // prefill name once we know who is signed in
  useEffect(() => {
    if (user?.name) setForm((f) => (f.name ? f : { ...f, name: user.name }));
  }, [user]);

  // cart changed -> coupon preview is stale
  useEffect(() => {
    setCoupon(null);
  }, [subtotal]);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const cartPayload = items.map((i) => ({ productId: i.id, qty: i.qty }));
  const discount = coupon?.discount || 0;
  const total = Math.max(0, subtotal - discount);

  if (items.length === 0 && !submitting) {
    return (
      <div className="rounded-xl bg-white p-12 text-center shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">Your cart is empty</h2>
        <Link href="/products" className="mt-6 inline-block rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700">
          Continue Shopping
        </Link>
      </div>
    );
  }

  if (sessionLoading) return <div className="h-64 animate-pulse rounded-xl bg-gray-200" />;

  if (!user) {
    const cb = encodeURIComponent("/checkout");
    return (
      <div className="mx-auto max-w-lg rounded-xl bg-white p-10 text-center shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">Sign in to place your order</h2>
        <p className="mt-2 text-gray-500">
          An account lets us email your confirmation and lets you track your orders. Your cart will be kept.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href={`/login?callbackUrl=${cb}`} className="rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700">
            Sign in
          </Link>
          <Link href={`/register?callbackUrl=${cb}`} className="rounded-md bg-blue-100 px-6 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-200">
            Create account
          </Link>
        </div>
      </div>
    );
  }

  async function applyCoupon() {
    if (!couponInput.trim()) return;
    setCouponBusy(true);
    setCouponMsg("");
    try {
      const res = await fetch("/api/storefront/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput, items: cartPayload }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setCoupon(null);
        setCouponMsg(json?.message || "Invalid coupon");
        return;
      }
      setCoupon(json.data);
      setCouponMsg(`${json.data.title} applied`);
    } catch {
      setCouponMsg("Network error");
    } finally {
      setCouponBusy(false);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/storefront/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          paymentMethod: payment,
          couponCode: coupon?.code || "",
          items: cartPayload,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.message || "Could not place your order");
        setSubmitting(false);
        return;
      }
      clear();
      router.push(`/account/orders/${json.data.orderNumber}?placed=1`);
    } catch (err) {
      console.log("[CheckoutView]", err);
      setError("Network error, please try again");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Delivery details</h2>
        <p className="text-sm text-gray-500">
          Confirmation will be emailed to <span className="font-medium text-gray-800">{user.email}</span>
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <input name="name" required placeholder="Full name" value={form.name} onChange={onChange} className={inputCls} />
          <input name="phone" required type="tel" placeholder="Phone number" value={form.phone} onChange={onChange} className={inputCls} />
        </div>
        <input name="city" required placeholder="City / Town" value={form.city} onChange={onChange} className={inputCls} />
        <input name="address" required placeholder="Delivery address" value={form.address} onChange={onChange} className={inputCls} />
        <textarea name="notes" rows={3} placeholder="Order notes (optional)" value={form.notes} onChange={onChange} className={inputCls} />

        <h2 className="pt-2 text-lg font-semibold text-gray-900">Payment</h2>
        {Object.entries(PAYMENT_OPTIONS).map(([key, o]) => (
          <label key={key} className="flex cursor-pointer items-start gap-3 rounded-md border border-gray-200 p-3 hover:bg-gray-50">
            <input type="radio" name="payment" className="mt-1" checked={payment === key} onChange={() => setPayment(key)} />
            <span>
              <span className="block text-sm font-medium text-gray-800">{o.label}</span>
              <span className="block text-xs text-gray-500">{o.hint}</span>
            </span>
          </label>
        ))}
      </div>

      <aside className="h-fit rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Your order</h2>
        <ul className="mt-4 divide-y divide-gray-100 text-sm">
          {items.map((i) => (
            <li key={i.id} className="flex justify-between gap-3 py-2.5">
              <span className="text-gray-700">
                {i.name} <span className="text-gray-400">× {i.qty}</span>
              </span>
              <span className="shrink-0 font-semibold">{formatUGX(i.price * i.qty)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex gap-2">
          <input
            value={couponInput}
            onChange={(e) => setCouponInput(e.target.value)}
            placeholder="Coupon code"
            className={inputCls}
          />
          <button
            type="button"
            onClick={applyCoupon}
            disabled={couponBusy}
            className="shrink-0 rounded-md bg-blue-100 px-4 text-sm font-semibold text-blue-700 hover:bg-blue-200 disabled:opacity-60"
          >
            {couponBusy ? "..." : "Apply"}
          </button>
        </div>
        {couponMsg && <p className={`mt-1.5 text-xs ${coupon ? "text-green-600" : "text-red-600"}`}>{couponMsg}</p>}

        <div className="mt-4 space-y-1.5 border-t border-gray-200 pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-semibold">{formatUGX(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-green-700">
              <span>Discount</span>
              <span>- {formatUGX(discount)}</span>
            </div>
          )}
        </div>
        <div className="mt-3 flex justify-between border-t border-gray-200 pt-3 text-lg font-bold">
          <span>Total</span>
          <span className="text-blue-600">{formatUGX(total)}</span>
        </div>

        {error && <p className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-5 w-full rounded-md bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? "Placing order..." : "Place Order"}
        </button>
        <p className="mt-2 text-center text-xs text-gray-400">Final prices and stock are confirmed when you place the order.</p>
      </aside>
    </form>
  );
}