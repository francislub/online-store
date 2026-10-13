// app/api/storefront/orders/route.js
// Route: /api/storefront/orders  (GET my orders, POST place an order - signed-in customers)
//
// The customer is ALWAYS the signed-in storefront customer (requireCustomer, the same check
// the /api/storefront/account routes use), never the request body and never the staff/admin
// next-auth session. Order.customerId -> User.id, and emails go to that customer's email.
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { requireCustomer } from "@/lib/customerAuth";
import { OrderError, placeOrder, sendOrderEmails } from "@/lib/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TAG = "[api/storefront/orders]";

export async function GET() {
  try {
    const { customer, error } = await requireCustomer();
    if (error) return error;

    const orders = await db.order.findMany({
      where: { customerId: customer.id },
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
    const { customer, error } = await requireCustomer();
    if (error) return error;

    // Re-read the customer from the database: this user owns the order.
    const user = await db.user.findUnique({
      where: { id: customer.id },
      select: { id: true, name: true, email: true, phone: true, isActive: true },
    });
    if (!user || !user.isActive) return NextResponse.json({ message: "Account not available" }, { status: 403 });

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
    }

    // Delivery contact: what the customer typed, falling back to their account details.
    const name = String(body.name || user.name || "").trim();
    const phone = String(body.phone || user.phone || "").trim();
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

    // 1) Make sure the order is linked to the signed-in customer (Order.customerId -> User).
    //    The customer's name, email and phone are then read through the `customer` relation.
    if (order.customerId !== user.id) {
      try {
        await db.order.update({ where: { id: order.id }, data: { customerId: user.id } });
      } catch (e) {
        console.error(`${TAG} link customer`, e?.message || e);
      }
    }

    // 2) If the delivery recipient is a different person from the account holder, make sure
    //    their name is kept on the order (the Order model has no recipient field, so it goes in notes).
    try {
      if (name.toLowerCase() !== String(user.name || "").trim().toLowerCase()) {
        const saved = await db.order.findUnique({
          where: { id: order.id },
          select: { address: true, notes: true },
        });
        const text = `${saved?.address || ""} ${saved?.notes || ""}`.toLowerCase();
        if (saved && !text.includes(name.toLowerCase())) {
          const line = `Recipient: ${name}`;
          await db.order.update({
            where: { id: order.id },
            data: { notes: saved.notes ? `${line}. ${saved.notes}` : line },
          });
        }
      }
    } catch (e) {
      console.error(`${TAG} recipient note`, e?.message || e);
    }

    // 3) Staff notification + emails (failures never undo the order).
    try {
      await db.notification.create({
        data: {
          userId: null,
          title: `New order ${order.orderNumber}`,
          message: `${user.name} (${user.email}, ${phone}) ordered ${order.items.length} item(s), total UGX ${order.total.toLocaleString("en-US")}`,
          type: "ORDER",
        },
      });
    } catch (e) {
      console.error(`${TAG} notification`, e?.message || e);
    }

    try {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
      await sendOrderEmails({ order, user, baseUrl });
    } catch (e) {
      console.error(`${TAG} emails`, e?.message || e);
    }

    return NextResponse.json(
      {
        data: {
          id: order.id,
          orderNumber: order.orderNumber,
          total: order.total,
          customer: { id: user.id, name: user.name, email: user.email },
        },
        message: "Order placed successfully",
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof OrderError) return NextResponse.json({ message: err.message }, { status: err.status });
    console.error(`${TAG} POST`, err?.code || "", err?.message || err);
    return NextResponse.json({ message: "Could not place your order. Please try again." }, { status: 500 });
  }
}