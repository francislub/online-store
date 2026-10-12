// src/components/frontend/MonitorsSection.jsx
import React from "react";
import ProductRow from "./ProductRow";
import { monitors } from "@/data/homeData";

export default function MonitorsSection() {
  return <ProductRow title="Monitors" href="/category/monitors" products={monitors} />;
}
