// src/app/(frontend)/product/[slug]/page.jsx
// Route: /product/:slug   e.g. /product/hp-probook-450 (a plain name like /product/hp also resolves)
import React from "react";
import { notFound, redirect } from "next/navigation";
import ProductDetail from "@/components/frontend/ProductDetail";
import ProductRow from "@/components/frontend/ProductRow";
import { getProductDetail } from "@/lib/productDetail";
import { SITE } from "@/lib/siteConfig";

export const dynamic = "force-dynamic";

async function load(slug) {
  try {
    return await getProductDetail(slug);
  } catch (err) {
    console.error("[product page]", err?.message || err);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const detail = await load(slug);
  if (!detail) return { title: `Product not found | ${SITE.name}` };

  const p = detail.product;
  const description = (p.description || `Buy ${p.name} at ${SITE.name}`).slice(0, 160);
  return {
    title: `${p.name} | ${SITE.name}`,
    description,
    alternates: { canonical: p.href },
    openGraph: { title: p.name, description, images: p.image ? [p.image] : [] },
  };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const detail = await load(slug);
  if (!detail) notFound();

  const { product, related } = detail;

  // /product/hp  ->  /product/hp-probook-450 (canonical, name-based slug)
  let requested = slug;
  try { requested = decodeURIComponent(slug); } catch {}
  if (requested !== product.slug) redirect(product.href);

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