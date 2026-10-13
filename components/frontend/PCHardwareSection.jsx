// src/components/frontend/PCHardwareSection.jsx
// Route: n/a (home page section)
// Data: GET /api/storefront/products?category=<slug>&limit=6 (from the database)
"use client";

import React, { useEffect, useState } from "react";
import ProductRow from "./ProductRow";

// MUST match the `slug` of a Category document in your database.
const DEFAULT_SLUG = "pc-hardware";
const LIMIT = 6;

export default function PCHardwareSection({
  categorySlug = DEFAULT_SLUG,
  title = "PC Hardware",
}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const params = new URLSearchParams({
          category: categorySlug,
          sort: "featured",
          limit: String(LIMIT),
        });
        const res = await fetch(`/api/storefront/products?${params}`, {
          signal: controller.signal,
          cache: "no-store",
        });

        if (res.status === 404) {
          // The API answers 404 only when no Category has this slug.
          console.warn(
            `[PCHardwareSection] No category with slug "${categorySlug}". ` +
              `Check the Category collection or pass the correct categorySlug prop.`
          );
          setProducts([]);
          return;
        }
        if (!res.ok) throw new Error(`Request failed (${res.status})`);

        const json = await res.json();
        setProducts(Array.isArray(json.data) ? json.data : []);
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("[PCHardwareSection]", err);
        setProducts([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [categorySlug]);

  return (
    <ProductRow
      title={title}
      href={`/category/${categorySlug}`}
      products={products}
      loading={loading}
    />
  );
}