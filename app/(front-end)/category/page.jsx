// src/app/(front-end)/category/page.jsx
// Route: /category
import React from "react";
import CategoryIndex from "@/components/frontend/CategoryIndex";
import { SITE } from "@/lib/siteConfig";

export const metadata = {
  title: `Shop By Category | ${SITE.name}`,
  description: SITE.tagline,
};

export default function CategoriesPage() {
  return <CategoryIndex />;
}