// src/components/frontend/ProductRow.jsx
// Route: n/a (reusable row used on the home page)
import React from "react";
import SectionHeader from "./SectionHeader";
import ProductCard from "./ProductCard";

function RowSkeleton() {
  return (
    <div className="-mx-4 flex gap-4 overflow-hidden px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-[340px] w-[200px] shrink-0 animate-pulse rounded-xl bg-gray-200 sm:w-auto" />
      ))}
    </div>
  );
}

// Reusable "title + More Products + row of 6 cards" block.
export default function ProductRow({ title, href, products = [], loading = false }) {
  if (!loading && products.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      <SectionHeader title={title} href={href} />
      {loading ? (
        <RowSkeleton />
      ) : (
        <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-6">
          {products.map((p) => (
            <div key={p.id} className="w-[200px] shrink-0 sm:w-auto">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}