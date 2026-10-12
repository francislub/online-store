// src/components/frontend/AccessoriesBanner.jsx
"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { accessoriesBanner, accessories } from "@/data/homeData";
import { useCart, formatUGX } from "@/context/CartContext";
import { Stars } from "./ProductCard";

export default function AccessoriesBanner() {
  const { addItem } = useCart();

  return (
    <section className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-rose-100 via-purple-100 to-sky-100 p-4 sm:p-6">
        <div className="grid items-center gap-6 md:grid-cols-2">
          <div className="flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={accessoriesBanner.image}
              alt={accessoriesBanner.title}
              className="max-h-[280px] w-full object-contain"
            />
          </div>
          <div>
            <h2 className="text-4xl font-bold leading-tight text-gray-900 sm:text-5xl">
              {accessoriesBanner.title}
            </h2>
            <p className="mt-4 text-xl text-gray-700">{accessoriesBanner.subtitle}</p>
            <Link
              href={accessoriesBanner.href}
              className="mt-6 inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              {accessoriesBanner.cta} <ChevronRight size={16} />
            </Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {accessories.map((p) => (
            <div key={p.id} className="group relative flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm">
              <Link href={p.href} className="flex h-24 w-24 shrink-0 items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt={p.name} loading="lazy" className="max-h-full max-w-full object-contain" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={p.href} className="line-clamp-3 text-[15px] font-semibold leading-snug text-gray-800 hover:text-blue-600">
                  {p.name}
                </Link>
                <div className="mt-2">
                  <Stars />
                </div>
                <p className="mt-2 text-[15px] font-bold text-blue-600">{formatUGX(p.price)}</p>
              </div>
              <button
                onClick={() => addItem(p)}
                aria-label={`Add ${p.name} to cart`}
                className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white opacity-100 shadow transition hover:bg-blue-700 lg:opacity-0 lg:group-hover:opacity-100"
              >
                <Plus size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
