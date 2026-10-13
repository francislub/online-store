// app/api/storefront/orders/[orderNumber]/route.js
// Route: /api/storefront/orders/:orderNumber  (GET details, PATCH { action: "cancel" })
// Only the customer who placed the order (Order.customerId) can read or cancel it.
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { requireCustomer } from "@/lib/customerAuth";
import { OrderError, cancelOrder, sendCancelEmail } from "@/lib/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  try {
    const { customer, error } = await requireCustomer();
    if (error) return error;

    const { orderNumber } = await params;
    const order = await db.order.findUnique({
      where: { orderNumber },
      include: {
        items: { include: { product: { select: { name: true, slug: true, imageUrls: true, sku: true } } } },
        payments: { select: { method: true, status: true, notes: true, amount: true } },
        coupon: { select: { title: true, couponCode: true } },
        customer: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    if (!order || order.customerId !== customer.id)
      return NextResponse.json({ message: "Order not found" }, { status: 404 });

    return NextResponse.json({ data: order });
  } catch (err) {
    console.error("[api/storefront/orders/:n] GET", err?.message || err);
    return NextResponse.json({ message: "Failed to load order" }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { customer, error } = await requireCustomer();
    if (error) return error;

    const { orderNumber } = await params;
    const body = await request.json().catch(() => ({}));
    if (body.action !== "cancel") return NextResponse.json({ message: "Unsupported action" }, { status: 400 });

    const order = await cancelOrder({ orderNumber, userId: customer.id, isAdmin: false });

    try {
      await sendCancelEmail({ order, user: { name: customer.name, email: customer.email } });
    } catch (e) {
      console.error("[api/storefront/orders/:n] cancel email", e?.message || e);
    }

    return NextResponse.json({ message: "Order cancelled" });
  } catch (err) {
    if (err instanceof OrderError) return NextResponse.json({ message: err.message }, { status: err.status });
    console.error("[api/storefront/orders/:n] PATCH", err?.message || err);
    return NextResponse.json({ message: "Failed to cancel order" }, { status: 500 });
  }
}