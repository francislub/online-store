// Route: /api/coupons
// Methods: GET (list + ?search=), POST (create), DELETE (bulk delete, body: { ids: [...] })
// File: src/app/api/coupons/route.js
import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request) {
  try {
    const search = new URL(request.url).searchParams.get("search")?.trim();

    const coupons = await db.coupon.findMany({
      where: search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { couponCode: { contains: search, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(coupons);
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Failed to fetch coupons", error: String(error) }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { title, couponCode, expiryDate, isActive } = body;

    if (!title || !couponCode || !expiryDate) {
      return NextResponse.json({ message: "Title, coupon code and expiry date are required" }, { status: 400 });
    }

    const discountType = body.discountType === "FIXED" ? "FIXED" : "PERCENTAGE";
    const discountValue = Number(body.discountValue);
    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      return NextResponse.json({ message: "Discount value must be greater than 0" }, { status: 400 });
    }
    if (discountType === "PERCENTAGE" && discountValue > 100) {
      return NextResponse.json({ message: "Percentage discount cannot exceed 100" }, { status: 400 });
    }

    const existing = await db.coupon.findUnique({ where: { couponCode } });
    if (existing) {
      return NextResponse.json({ message: `Coupon code ${couponCode} already exists` }, { status: 409 });
    }

    const newCoupon = await db.coupon.create({
      data: {
        title,
        couponCode,
        discountType,
        discountValue,
        minOrderTotal: Number(body.minOrderTotal) || 0,
        usageLimit: body.usageLimit ? Number(body.usageLimit) : null,
        expiryDate: new Date(expiryDate),
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(newCoupon, { status: 201 });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Failed to create coupon", error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ message: "No coupon ids provided" }, { status: 400 });
    }

    // Skip coupons that are already attached to orders
    const result = await db.coupon.deleteMany({
      where: { id: { in: ids }, orders: { none: {} } },
    });

    const skipped = ids.length - result.count;
    return NextResponse.json({
      message:
        skipped > 0
          ? `${result.count} deleted, ${skipped} skipped (used in orders)`
          : `${result.count} coupon(s) deleted`,
      deleted: result.count,
      skipped,
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Failed to delete coupons", error: String(error) }, { status: 500 });
  }
}