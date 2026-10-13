// src/app/(frontend)/layout.jsx
// Route: n/a (shared layout for every storefront page: /, /products, /category, /category/:slug)
import React from "react";
import SiteShell from "@/components/frontend/SiteShell";

export default function FrontendLayout({ children }) {
  return <SiteShell>{children}</SiteShell>;
}