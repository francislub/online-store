// src/components/frontend/PCHardwareSection.jsx
import React from "react";
import ProductRow from "./ProductRow";
import { pcHardware } from "@/data/homeData";

export default function PCHardwareSection() {
  return <ProductRow title="PC Hardware" href="/category/pc-hardware" products={pcHardware} />;
}
