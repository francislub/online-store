// Route: /api/coupons/[id]
// Methods: GET (view one), PUT (update), DELETE (delete one)
// File: src/app/api/coupons/[id]/route.js
import { NextResponse } from "next/server";
import db from "@/lib/db";

const isObjectId = (id) => /^[a-f\d]{24}$/i.test(id);

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!isObjectId(id)) {
      return NextResponse.json({ message: "Invalid coupon id" }, { status: 400 });
    }

    const coupon = await db.coupon.findUnique({ where: { id } });
    if (!coupon) {
      return NextResponse.json({ message: "Coupon not found" }, { status: 404 });
    }
    return NextResponse.json(coupon);
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Failed to fetch coupon", error: String(error) }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    if (!isObjectId(id)) {
      return NextResponse.json({ message: "Invalid coupon id" }, { status: 400 });
    }

    const body = await request.json();
    const data = {};

    if (body.title !== undefined) data.title = body.title;
    if (body.expiryDate !== undefined) data.expiryDate = new Date(body.expiryDate);
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
    if (body.discountType !== undefined) {
      data.discountType = body.discountType === "FIXED" ? "FIXED" : "PERCENTAGE";
    }
    if (body.discountValue !== undefined) {
      const value = Number(body.discountValue);
      if (!Number.isFinite(value) || value <= 0) {
        return NextResponse.json({ message: "Discount value must be greater than 0" }, { status: 400 });
      }
      data.discountValue = value;
    }
    if (body.minOrderTotal !== undefined) data.minOrderTotal = Number(body.minOrderTotal) || 0;
    if (body.usageLimit !== undefined) data.usageLimit = body.usageLimit ? Number(body.usageLimit) : null;

    const existing = await db.coupon.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ message: "Coupon not found" }, { status: 404 });
    }

    const updated = await db.coupon.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Failed to update coupon", error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    if (!isObjectId(id)) {
      return NextResponse.json({ message: "Invalid coupon id" }, { status: 400 });
    }

    const existing = await db.coupon.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ message: "Coupon not found" }, { status: 404 });
    }

    const usedInOrders = await db.order.count({ where: { couponId: id } });
    if (usedInOrders > 0) {
      return NextResponse.json(
        { message: `Cannot delete: coupon is used in ${usedInOrders} order(s). Deactivate it instead.` },
        { status: 409 }
      );
    }

    await db.coupon.delete({ where: { id } });
    return NextResponse.json({ message: "Coupon deleted successfully" });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Failed to delete coupon", error: String(error) }, { status: 500 });
  }
}