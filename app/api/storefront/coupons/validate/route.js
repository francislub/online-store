// app/api/storefront/coupons/validate/route.js
// Route: /api/storefront/coupons/validate  (POST { code, items } -> discount preview)
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { OrderError, resolveCoupon } from "@/lib/orders";
import { isValidId } from "@/lib/staff";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const { code, items } = await request.json().catch(() => ({}));
    const ids = (Array.isArray(items) ? items : []).map((i) => i.productId).filter(isValidId);
    if (!code || ids.length === 0) return NextResponse.json({ message: "Enter a coupon code" }, { status: 400 });

    const products = await db.product.findMany({
      where: { id: { in: ids }, isActive: true },
      select: { id: true, price: true, salePrice: true },
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    let subtotal = 0;
    for (const it of items) {
      const p = byId.get(it.productId);
      const qty = Math.max(1, Math.min(100, Number(it.qty) || 1));
      if (p) subtotal += (p.salePrice != null && p.salePrice > 0 && p.salePrice < p.price ? p.salePrice : p.price) * qty;
    }

    const { coupon, discount } = await resolveCoupon(db, code, subtotal);
    return NextResponse.json({ data: { title: coupon.title, code: coupon.couponCode, discount } });
  } catch (err) {
    if (err instanceof OrderError) return NextResponse.json({ message: err.message }, { status: err.status });
    console.error("[api/storefront/coupons/validate]", err?.message || err);
    return NextResponse.json({ message: "Could not check coupon" }, { status: 500 });
  }
}