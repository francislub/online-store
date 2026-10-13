// src/app/(front-end)/category/[slug]/page.jsx
// Route: /category/:slug   e.g. /category/laptops
import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import db from "@/lib/db";
import ProductListing from "@/components/frontend/ProductListing";
import { SITE } from "@/lib/siteConfig";

export const dynamic = "force-dynamic";

async function getCategory(slug) {
  try {
    const c = await db.category.findUnique({
      where: { slug },
      select: { name: true, description: true, isActive: true },
    });
    return c && c.isActive ? c : null;
  } catch (err) {
    console.error("[category page]", err?.message || err);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return { title: `Category not found | ${SITE.name}` };
  return {
    title: `${category.name} | ${SITE.name}`,
    description: category.description || `Shop ${category.name} at ${SITE.name}`,
  };
}

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();

  return (
    <Suspense fallback={null}>
      <ProductListing categorySlug={slug} title={category.name} />
    </Suspense>
  );
}