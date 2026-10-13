// app/api/storefront/account/route.js
// GET -> profile + stats + addresses + order history (with items and invoices)
// PUT -> update name / phone / password
import db from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { jsonError, publicCustomer, requireCustomer } from "@/lib/customerAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { customer, error } = await requireCustomer();
    if (error) return error;

    const where = { customerId: customer.id };
    const [addresses, orders, agg, last] = await Promise.all([
      db.address.findMany({ where: { userId: customer.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] }),
      db.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          subtotal: true,
          discount: true,
          total: true,
          phone: true,
          address: true,
          notes: true,
          createdAt: true,
          items: {
            select: {
              id: true,
              quantity: true,
              unitPrice: true,
              total: true,
              product: { select: { name: true, slug: true, imageUrls: true } },
            },
          },
          invoices: { orderBy: { createdAt: "asc" }, select: { id: true, number: true, status: true, total: true, balance: true } },
        },
      }),
      db.order.aggregate({ where: { ...where, status: { not: "CANCELLED" } }, _sum: { total: true }, _count: true }),
      db.order.findFirst({ where, orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
    ]);

    return NextResponse.json({
      data: {
        customer: publicCustomer(customer),
        stats: { orderCount: agg._count, totalSpent: agg._sum.total ?? 0, lastOrderAt: last?.createdAt ?? null },
        addresses,
        orders: orders.map((o) => ({
          ...o,
          items: o.items.map((i) => ({
            id: i.id,
            name: i.product?.name ?? "Product",
            slug: i.product?.slug ?? null,
            image: i.product?.imageUrls?.[0] ?? null,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            total: i.total,
          })),
        })),
      },
    });
  } catch (err) {
    console.error("[account GET]", err);
    return jsonError("Failed to load your account", 500);
  }
}

export async function PUT(request) {
  try {
    const { customer, error } = await requireCustomer();
    if (error) return error;

    const body = await request.json();
    const data = {};

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) return jsonError("Name is required");
      data.name = name;
    }
    if (body.phone !== undefined) data.phone = body.phone ? String(body.phone).trim() : null;

    if (body.newPassword) {
      if (String(body.newPassword).length < 8) return jsonError("New password must be at least 8 characters");
      if (customer.passwordHash) {
        const ok = await bcrypt.compare(String(body.currentPassword ?? ""), customer.passwordHash);
        if (!ok) return jsonError("Current password is incorrect", 400);
      }
      data.passwordHash = await bcrypt.hash(String(body.newPassword), 10);
    }

    if (Object.keys(data).length === 0) return jsonError("Nothing to update");

    const updated = await db.user.update({ where: { id: customer.id }, data });
    return NextResponse.json({ data: publicCustomer(updated), message: "Profile updated" });
  } catch (err) {
    console.error("[account PUT]", err);
    return jsonError("Server error: something went wrong", 500);
  }
}