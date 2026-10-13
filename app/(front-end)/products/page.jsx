// src/app/(front-end)/products/page.jsx
// Route: /products   (supports ?q= &sort= &brand= &minPrice= &maxPrice= &inStock= &page=)
import React, { Suspense } from "react";
import ProductListing from "@/components/frontend/ProductListing";
import { SITE } from "@/lib/siteConfig";

export const metadata = {
  title: `All Products | ${SITE.name}`,
  description: SITE.tagline,
};

export default function ProductsPage() {
  return (
    <Suspense fallback={null}>
      <ProductListing title="All Products" />
    </Suspense>
  );
}