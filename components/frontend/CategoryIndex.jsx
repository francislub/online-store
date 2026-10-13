// src/components/frontend/CategoryIndex.jsx
// Route: /category (all categories with their sub-categories)
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

const PLACEHOLDER = "/images/placeholder.png";

export default function CategoryIndex() {
  const [categories, setCategories] = useState(null); // null = loading
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/storefront/categories", { cache: "no-store" });
        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error(json?.message || "Failed to load categories");
        if (!cancelled) setCategories(json.data || []);
      } catch (err) {
        console.log("[CategoryIndex]", err);
        if (!cancelled) {
          setError(err.message || "Network error");
          setCategories([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-3 text-sm text-gray-500">
        <Link href="/" className="hover:text-blue-600">Home</Link> / <span className="font-medium text-gray-800">Categories</span>
      </nav>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Shop By Category</h1>

      {categories === null && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-[260px] animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      )}

      {error && <p className="text-red-600">{error}</p>}

      {categories && !error && categories.length === 0 && (
        <p className="text-gray-500">No categories available yet.</p>
      )}

      {categories && categories.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {categories.map((c) => (
            <div key={c.id} className="flex flex-col rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
              <Link href={c.href} className="group block text-center">
                <div className="flex h-36 items-center justify-center overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.image || PLACEHOLDER}
                    alt={c.name}
                    loading="lazy"
                    className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <h2 className="mt-3 text-base font-semibold text-gray-800 group-hover:text-blue-600">{c.name}</h2>
                <p className="mt-0.5 text-sm text-gray-500">{c.count} products</p>
              </Link>

              {c.children.length > 0 && (
                <ul className="mt-3 space-y-1 border-t border-gray-100 pt-3 text-sm">
                  {c.children.slice(0, 5).map((s) => (
                    <li key={s.id}>
                      <Link href={s.href} className="flex justify-between text-gray-600 hover:text-blue-600">
                        <span>{s.name}</span>
                        <span className="text-gray-400">{s.count}</span>
                      </Link>
                    </li>
                  ))}
                  {c.children.length > 5 && (
                    <li>
                      <Link href={c.href} className="text-blue-600 hover:underline">
                        +{c.children.length - 5} more
                      </Link>
                    </li>
                  )}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}