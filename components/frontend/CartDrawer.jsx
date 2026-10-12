// src/components/frontend/CartDrawer.jsx
"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";
import { useCart, formatUGX, FREE_SHIPPING_THRESHOLD } from "@/context/CartContext";

export default function CartDrawer() {
  const { items, open, setOpen, updateQty, removeItem, subtotal } = useCart();

  // close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  const qualifies = subtotal >= FREE_SHIPPING_THRESHOLD;
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <>
      {/* overlay */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-[60] bg-black/60 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden="true"
      />

      {/* panel */}
      <aside
        role="dialog"
        aria-label="Shopping cart"
        aria-hidden={!open}
        className={`fixed right-0 top-0 z-[70] flex h-full w-full max-w-[340px] flex-col bg-white shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4">
          <h2 className="text-xl font-semibold text-gray-900">Shopping cart</h2>
          <button
            onClick={() => setOpen(false)}
            className="flex items-center gap-1.5 text-[15px] font-medium text-gray-800 hover:text-blue-600"
          >
            <X size={18} /> Close
          </button>
        </div>

        {/* items */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <p className="p-6 text-center text-sm text-gray-500">Your cart is empty.</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="relative flex gap-3 border-b border-gray-200 p-4">
                <button
                  onClick={() => removeItem(item.id)}
                  aria-label={`Remove ${item.name}`}
                  className="absolute right-3 top-3 text-gray-500 hover:text-red-600"
                >
                  <X size={14} />
                </button>

                <div className="h-16 w-16 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image} alt={item.name} className="h-full w-full object-contain" />
                </div>

                <div className="min-w-0 flex-1 pr-4">
                  <p className="text-[14.5px] font-semibold leading-snug text-gray-900">{item.name}</p>
                  <p className="mt-2 text-[13px] text-gray-500">
                    <span className="font-semibold text-gray-700">SKU:</span> {item.sku}
                  </p>

                  <div className="mt-2 inline-flex items-center overflow-hidden rounded-md border border-gray-200">
                    <button
                      onClick={() => updateQty(item.id, item.qty - 1)}
                      disabled={item.qty <= 1}
                      aria-label="Decrease quantity"
                      className="flex h-8 w-8 items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="flex h-8 w-9 items-center justify-center text-sm font-medium">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => updateQty(item.id, item.qty + 1)}
                      aria-label="Increase quantity"
                      className="flex h-8 w-8 items-center justify-center text-gray-600 hover:bg-gray-50"
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  <p className="mt-2 text-[13px] text-gray-400">
                    {item.qty} × <span className="font-semibold text-blue-600">{formatUGX(item.price)}</span>
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* footer */}
        <div className="border-t border-gray-200 bg-white">
          <div className="flex items-center justify-between px-4 py-4">
            <span className="text-xl font-semibold text-gray-900">Subtotal:</span>
            <span className="text-xl font-semibold text-blue-600">{formatUGX(subtotal)}</span>
          </div>

          <div className="border-t border-gray-200 px-4 py-4">
            <p className="text-sm text-gray-500">
              {qualifies
                ? "Your order qualifies for free shipping!"
                : `Add ${formatUGX(remaining)} more to get free shipping.`}
            </p>
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  backgroundColor: "#2563eb",
                  backgroundImage:
                    "repeating-linear-gradient(45deg, rgba(255,255,255,0.35) 0 8px, transparent 8px 16px)",
                  backgroundSize: "22px 22px",
                  animation: "nx-stripes 1s linear infinite",
                }}
              />
            </div>

            <Link
              href="/cart"
              onClick={() => setOpen(false)}
              className="mt-4 block w-full rounded-md bg-blue-100 py-3 text-center text-sm font-semibold text-blue-700 hover:bg-blue-200"
            >
              View Cart
            </Link>
            <Link
              href="/checkout"
              onClick={() => setOpen(false)}
              className="mt-3 block w-full rounded-md bg-blue-600 py-3 text-center text-sm font-semibold text-white hover:bg-blue-700"
            >
              Checkout
            </Link>
          </div>
        </div>
      </aside>

      <style jsx global>{`
        @keyframes nx-stripes {
          from {
            background-position: 0 0;
          }
          to {
            background-position: 22px 0;
          }
        }
      `}</style>
    </>
  );
}
