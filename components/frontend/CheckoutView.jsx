// src/components/frontend/CheckoutView.jsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCart, formatUGX } from "@/context/CartContext";

const inputCls =
  "w-full rounded-md border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

export default function CheckoutView() {
  const { items, subtotal, clear } = useCart();
  const [payment, setPayment] = useState("cod");
  const [placed, setPlaced] = useState(false);

  if (placed) {
    return (
      <div className="rounded-xl bg-white p-12 text-center shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900">Order received</h2>
        <p className="mt-2 text-gray-500">Thank you! We will contact you to confirm delivery.</p>
        <Link href="/" className="mt-6 inline-block rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700">
          Back to Home
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl bg-white p-12 text-center shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">Your cart is empty</h2>
        <Link href="/" className="mt-6 inline-block rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700">
          Continue Shopping
        </Link>
      </div>
    );
  }

  const onSubmit = (e) => {
    e.preventDefault();
    // TODO: send the order (items + form data + payment) to your API
    clear();
    setPlaced(true);
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Delivery details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <input required placeholder="Full name" className={inputCls} />
          <input required type="tel" placeholder="Phone number" className={inputCls} />
        </div>
        <input type="email" placeholder="Email (optional)" className={inputCls} />
        <input required placeholder="City / Town" className={inputCls} />
        <input required placeholder="Delivery address" className={inputCls} />
        <textarea rows={3} placeholder="Order notes (optional)" className={inputCls} />

        <h2 className="pt-2 text-lg font-semibold text-gray-900">Payment</h2>
        {[
          ["cod", "Pay on delivery"],
          ["momo", "Mobile Money"],
          ["card", "Card"],
        ].map(([key, label]) => (
          <label key={key} className="flex cursor-pointer items-center gap-3 rounded-md border border-gray-200 p-3 hover:bg-gray-50">
            <input type="radio" name="payment" checked={payment === key} onChange={() => setPayment(key)} />
            <span className="text-sm font-medium text-gray-800">{label}</span>
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
        <div className="mt-4 flex justify-between border-t border-gray-200 pt-4 text-lg font-bold">
          <span>Total</span>
          <span className="text-blue-600">{formatUGX(subtotal)}</span>
        </div>
        <button type="submit" className="mt-5 w-full rounded-md bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700">
          Place Order
        </button>
      </aside>
    </form>
  );
}
