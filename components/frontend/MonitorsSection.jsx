// src/components/frontend/MonitorsSection.jsx
// Server component: reads from the database through getHomeData()
import React from "react";
import ProductRow from "./ProductRow";
import { getHomeData } from "@/lib/storefront";

export default async function MonitorsSection() {
  let monitors = [];

  try {
    const data = await getHomeData();
    monitors = data.monitors || [];
  } catch (error) {
    console.log(error);
  }

  if (monitors.length === 0) return null;

  return <ProductRow title="Monitors" href="/category/monitors" products={monitors} />;
}