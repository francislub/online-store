// app/api/storefront/orders/[orderNumber]/route.js
// Route: /api/storefront/orders/:orderNumber  (GET details, PATCH { action: "cancel" })
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";
import { OrderError, cancelOrder, sendCancelEmail } from "@/lib/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getUser() {
  const session = await getServerSession(authOptions);
  return session?.user?.id ? session.user : null;
}

export async function GET(request, { params }) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ message: "Please sign in" }, { status: 401 });

    const { orderNumber } = await params;
    const order = await db.order.findUnique({
      where: { orderNumber },
      include: {
        items: { include: { product: { select: { name: true, slug: true, imageUrls: true, sku: true } } } },
        payments: { select: { method: true, status: true, notes: true, amount: true } },
        coupon: { select: { title: true, couponCode: true } },
      },
    });

    if (!order || (order.customerId !== user.id && user.role !== "ADMIN"))
      return NextResponse.json({ message: "Order not found" }, { status: 404 });

    return NextResponse.json({ data: order });
  } catch (err) {
    console.error("[api/storefront/orders/:n] GET", err?.message || err);
    return NextResponse.json({ message: "Failed to load order" }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ message: "Please sign in" }, { status: 401 });

    const { orderNumber } = await params;
    const body = await request.json().catch(() => ({}));
    if (body.action !== "cancel") return NextResponse.json({ message: "Unsupported action" }, { status: 400 });

    const order = await cancelOrder({ orderNumber, userId: user.id, isAdmin: user.role === "ADMIN" });

    const owner = await db.user.findUnique({ where: { id: order.customerId }, select: { name: true, email: true } });
    if (owner) await sendCancelEmail({ order, user: owner });

    return NextResponse.json({ message: "Order cancelled" });
  } catch (err) {
    if (err instanceof OrderError) return NextResponse.json({ message: err.message }, { status: err.status });
    console.error("[api/storefront/orders/:n] PATCH", err?.message || err);
    return NextResponse.json({ message: "Failed to cancel order" }, { status: 500 });
  }
}