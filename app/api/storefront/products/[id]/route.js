// app/api/storefront/products/[id]/route.js
// Route: /api/storefront/products/:id  (GET, public)
import { NextResponse } from "next/server";
import { getProductDetail } from "@/lib/productDetail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!id || !String(id).trim()) {
      return NextResponse.json({ message: "Product id is required" }, { status: 400 });
    }

    const detail = await getProductDetail(id);
    if (!detail) return NextResponse.json({ message: "Product not found" }, { status: 404 });

    return NextResponse.json({ data: detail.product, related: detail.related });
  } catch (err) {
    console.error("[api/storefront/products/:id]", err?.code || "", err?.message || err);
    return NextResponse.json({ message: "Failed to load product" }, { status: 500 });
  }
}