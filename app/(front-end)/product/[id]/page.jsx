// src/app/(frontend)/product/[id]/page.jsx
// Route: /product/:id   e.g. /product/6acea3b0fdf82d229ba07c99
// Put this in the SAME route group folder as your working home page, and make sure
// the old product/[slug] folder is deleted (two different dynamic names can't coexist).
import React from "react";
import { notFound, redirect } from "next/navigation";
import ProductDetail from "@/components/frontend/ProductDetail";
import ProductRow from "@/components/frontend/ProductRow";
import { getProductDetail } from "@/lib/productDetail";
import { SITE } from "@/lib/siteConfig";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { id } = await params;
  try {
    const detail = await getProductDetail(id);
    if (!detail) return { title: `Product not found | ${SITE.name}` };

    const p = detail.product;
    const description = (p.description || `Buy ${p.name} at ${SITE.name}`).slice(0, 160);
    return {
      title: `${p.name} | ${SITE.name}`,
      description,
      alternates: { canonical: p.href },
      openGraph: { title: p.name, description, images: p.image ? [p.image] : [] },
    };
  } catch (err) {
    console.error("[product metadata]", err?.message || err);
    return { title: `Product | ${SITE.name}` };
  }
}

export default async function ProductPage({ params }) {
  const { id } = await params;

  // Real errors are NOT swallowed any more: they show the actual cause instead of a fake 404.
  let detail;
  try {
    detail = await getProductDetail(id);
  } catch (err) {
    console.error("[product page] failed to load", id, err);
    throw err;
  }

  if (!detail) notFound();

  const { product, related } = detail;

  // An old slug/name link is sent to the canonical id URL: /product/<product.id>
  let requested = id;
  try {
    requested = decodeURIComponent(id);
  } catch {}
  if (requested.toLowerCase() !== String(product.id).toLowerCase()) redirect(product.href);

  return (
    <>
      <ProductDetail product={product} />
      <ProductRow
        title="Related products"
        href={product.category ? `/category/${product.category.slug}` : "/products"}
        products={related}
      />
      <div className="h-10" />
    </>
  );
}