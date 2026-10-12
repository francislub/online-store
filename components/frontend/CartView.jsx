// src/components/frontend/CartView.jsx
"use client";

import React from "react";
import Link from "next/link";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useCart, formatUGX, FREE_SHIPPING_THRESHOLD } from "@/context/CartContext";

export default function CartView() {
  const { items, updateQty, removeItem, clear, subtotal } = useCart();
  const qualifies = subtotal >= FREE_SHIPPING_THRESHOLD;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-xl bg-white p-12 text-center shadow-sm">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          <ShoppingCart size={28} />
        </span>
        <h2 className="mt-5 text-xl font-semibold text-gray-900">Your cart is empty</h2>
        <p className="mt-2 text-gray-500">Looks like you have not added anything yet.</p>
        <Link href="/" className="mt-6 rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <ul className="divide-y divide-gray-200">
          {items.map((item) => (
            <li key={item.id} className="flex gap-4 p-4 sm:p-5">
              <div className="h-24 w-24 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image} alt={item.name} className="h-full w-full object-contain" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-snug text-gray-900">{item.name}</p>
                <p className="mt-1 text-sm text-gray-500">SKU: {item.sku}</p>
                <p className="mt-1 text-sm font-semibold text-blue-600">{formatUGX(item.price)}</p>

                <div className="mt-3 flex flex-wrap items-center gap-4">
                  <div className="inline-flex items-center overflow-hidden rounded-md border border-gray-200">
                    <button
                      onClick={() => updateQty(item.id, item.qty - 1)}
                      disabled={item.qty <= 1}
                      aria-label="Decrease quantity"
                      className="flex h-9 w-9 items-center justify-center hover:bg-gray-50 disabled:opacity-40"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="flex h-9 w-10 items-center justify-center text-sm font-medium">{item.qty}</span>
                    <button
                      onClick={() => updateQty(item.id, item.qty + 1)}
                      aria-label="Increase quantity"
                      className="flex h-9 w-9 items-center justify-center hover:bg-gray-50"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600"
                  >
                    <Trash2 size={15} /> Remove
                  </button>
                </div>
              </div>
              <p className="hidden shrink-0 font-bold text-gray-900 sm:block">{formatUGX(item.price * item.qty)}</p>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between border-t border-gray-200 p-4">
          <Link href="/" className="text-sm font-semibold text-blue-600 hover:underline">
            ← Continue shopping
          </Link>
          <button onClick={clear} className="text-sm text-gray-500 hover:text-red-600">
            Clear cart
          </button>
        </div>
      </div>

      <aside className="h-fit rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Order summary</h2>
        <div className="mt-4 flex justify-between text-sm">
          <span className="text-gray-500">Subtotal</span>
          <span className="font-semibold">{formatUGX(subtotal)}</span>
        </div>
        <div className="mt-2 flex justify-between text-sm">
          <span className="text-gray-500">Shipping</span>
          <span className="font-semibold">{qualifies ? "Free" : "Calculated at checkout"}</span>
        </div>
        <div className="mt-4 flex justify-between border-t border-gray-200 pt-4 text-lg font-bold">
          <span>Total</span>
          <span className="text-blue-600">{formatUGX(subtotal)}</span>
        </div>
        <Link
          href="/checkout"
          className="mt-5 block rounded-md bg-blue-600 py-3 text-center text-sm font-semibold text-white hover:bg-blue-700"
        >
          Proceed to Checkout
        </Link>
      </aside>
    </div>
  );
}
