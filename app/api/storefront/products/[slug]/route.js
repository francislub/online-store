// app/api/storefront/products/[slug]/route.js
// Route: /api/storefront/products/:slug  (GET, public). Accepts a slug or a product name.
import { NextResponse } from "next/server";
import { getProductDetail } from "@/lib/productDetail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    const detail = await getProductDetail(slug);
    if (!detail) return NextResponse.json({ message: "Product not found" }, { status: 404 });
    return NextResponse.json({ data: detail.product, related: detail.related });
  } catch (err) {
    console.error("[api/storefront/products/:slug]", err?.code || "", err?.message || err);
    return NextResponse.json({ message: "Failed to load product" }, { status: 500 });
  }
}