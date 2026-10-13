// src/components/frontend/NewArrivals.jsx
// Route: / (home page, "New Arrivals" row)
"use client";

import React from "react";
import ProductRow from "./ProductRow";
import { useHomeData } from "@/lib/useHomeData";

export default function NewArrivals() {
  const { data, loading } = useHomeData();

  return (
    <ProductRow
      title="New Arrivals"
      href="/products?sort=newest"
      products={data?.newArrivals || []}
      loading={loading}
    />
  );
}