// src/components/frontend/ProductCard.jsx
"use client";

import React from "react";
import Link from "next/link";
import { Check, Star } from "lucide-react";
import { useCart, formatUGX } from "@/context/CartContext";

export function Stars({ size = 12 }) {
  return (
    <div className="flex items-center gap-0.5 text-gray-300" aria-label="No ratings yet">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} size={size} />
      ))}
    </div>
  );
}

export default function ProductCard({ product, showSku = false, showBrand = true }) {
  const { addItem } = useCart();
  const inStock = product.inStock !== false;

  return (
    <div className="flex h-full flex-col rounded-xl bg-white p-3.5 shadow-sm transition-shadow hover:shadow-md">
      <Link
        href={product.href || "#"}
        className="relative flex h-40 items-center justify-center overflow-hidden"
      >
        {product.badges?.length > 0 && (
          <div className="absolute left-0 top-0 z-10 flex flex-col gap-1">
            {product.badges.map((b) => (
              <span
                key={b.label}
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold text-white ${b.color || "bg-blue-600"}`}
              >
                {b.label}
              </span>
            ))}
          </div>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="max-h-full max-w-full object-contain"
        />
      </Link>

      <Link
        href={product.href || "#"}
        className="mt-3 line-clamp-3 text-[14.5px] font-semibold leading-snug text-gray-800 hover:text-blue-600"
      >
        {product.name}
      </Link>

      {showBrand && product.brand && (
        <p className="mt-1.5 text-sm text-gray-400">{product.brand}</p>
      )}

      <div className="mt-1.5">
        <Stars />
      </div>

      <div className="mt-2 min-h-[22px] text-sm font-medium">
        {inStock ? (
          <span className="flex items-center gap-1.5 text-gray-800">
            <Check size={16} className="text-blue-600" /> In stock
          </span>
        ) : (
          <span className="text-red-700">Out of stock</span>
        )}
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        {product.oldPrice && (
          <span className="text-xs text-gray-400 line-through">{formatUGX(product.oldPrice)}</span>
        )}
        <span className="text-[15px] font-bold text-blue-600">{formatUGX(product.price)}</span>
      </div>

      <div className="mt-auto pt-3">
        {inStock ? (
          <button
            onClick={() => addItem(product)}
            className="w-full rounded-md bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 active:scale-[0.99]"
          >
            Add To Cart
          </button>
        ) : (
          <Link
            href={product.href || "#"}
            className="block w-full rounded-md bg-blue-600 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Read More
          </Link>
        )}
        {showSku && product.sku && (
          <p className="mt-2 text-xs text-gray-500">
            <span className="font-semibold text-gray-700">SKU:</span> {product.sku}
          </p>
        )}
      </div>
    </div>
  );
}
