// app/api/storefront/orders/route.js
// Route: /api/storefront/orders  (GET my orders, POST place an order — signed-in customers)
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";
import { OrderError, placeOrder, sendOrderEmails } from "@/lib/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TAG = "[api/storefront/orders]";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ message: "Please sign in" }, { status: 401 });

    const orders = await db.order.findMany({
      where: { customerId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        createdAt: true,
        items: { select: { quantity: true } },
      },
    });

    return NextResponse.json({
      data: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        total: o.total,
        createdAt: o.createdAt,
        itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
      })),
    });
  } catch (err) {
    console.error(`${TAG} GET`, err?.message || err);
    return NextResponse.json({ message: "Failed to load orders" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ message: "Please sign in to place an order" }, { status: 401 });

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, isActive: true },
    });
    if (!user || !user.isActive) return NextResponse.json({ message: "Account not available" }, { status: 403 });

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
    }

    const name = String(body.name || "").trim();
    const phone = String(body.phone || "").trim();
    const city = String(body.city || "").trim();
    const address = String(body.address || "").trim();
    const notes = String(body.notes || "").trim().slice(0, 500);

    if (name.length < 2) return NextResponse.json({ message: "Full name is required" }, { status: 400 });
    if (!/^[+\d][\d\s-]{6,19}$/.test(phone)) return NextResponse.json({ message: "Enter a valid phone number" }, { status: 400 });
    if (!city) return NextResponse.json({ message: "City / Town is required" }, { status: 400 });
    if (address.length < 4) return NextResponse.json({ message: "Delivery address is required" }, { status: 400 });

    const order = await placeOrder({
      user,
      name,
      phone,
      city,
      address,
      notes,
      paymentKey: body.paymentMethod,
      couponCode: body.couponCode,
      items: Array.isArray(body.items) ? body.items.map((i) => ({ productId: i.productId, qty: i.qty })) : [],
    });

    // after the order is saved: staff notification + emails (failures never undo the order)
    try {
      await db.notification.create({
        data: {
          userId: null,
          title: `New order ${order.orderNumber}`,
          message: `${name} ordered ${order.items.length} item(s), total UGX ${order.total.toLocaleString("en-US")}`,
          type: "ORDER",
        },
      });
    } catch (e) {
      console.error(`${TAG} notification`, e?.message || e);
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
    await sendOrderEmails({ order, user, baseUrl });

    return NextResponse.json(
      { data: { id: order.id, orderNumber: order.orderNumber, total: order.total }, message: "Order placed successfully" },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof OrderError) return NextResponse.json({ message: err.message }, { status: err.status });
    console.error(`${TAG} POST`, err?.code || "", err?.message || err);
    return NextResponse.json({ message: "Could not place your order. Please try again." }, { status: 500 });
  }
}