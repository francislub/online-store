// src/components/frontend/NewArrivals.jsx
import React from "react";
import ProductRow from "./ProductRow";
import { newArrivals } from "@/data/homeData";

export default function NewArrivals() {
  return <ProductRow title="New Arrivals" href="/shop?sort=newest" products={newArrivals} />;
}
