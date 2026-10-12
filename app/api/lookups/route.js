// app/api/lookups/route.js
// Lightweight search for the pickers in the order / quote / payment forms
//   /api/lookups?type=products&search=
//   /api/lookups?type=customers&search=
//   /api/lookups?type=orders&search=&withBalance=1
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { requireRole, ROLES, handleError } from "@/lib/apiAuth";
import { COUNTED_PAYMENT_STATUSES } from "@/lib/constants";

const contains = (term) => ({ contains: term, mode: "insensitive" });

export async function GET(request) {
  try {
    const { error } = await requireRole(ROLES.ORDERS);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const search = searchParams.get("search")?.trim() ?? "";

    if (type === "products") {
      const products = await db.product.findMany({
        where: {
          isActive: true,
          ...(search && {
            OR: [{ name: contains(search) }, { sku: contains(search) }, { barcode: contains(search) }, { brand: contains(search) }, { model: contains(search) }],
          }),
        },
        orderBy: { name: "asc" },
        take: 15,
        select: { id: true, name: true, sku: true, brand: true, model: true, price: true, salePrice: true, costPrice: true, stock: true },
      });
      return NextResponse.json(products);
    }

    if (type === "customers") {
      const customers = await db.user.findMany({
        where: {
          role: "CUSTOMER",
          isActive: true,
          ...(search && { OR: [{ name: contains(search) }, { email: contains(search) }, { phone: { contains: search } }] }),
        },
        orderBy: { name: "asc" },
        take: 15,
        select: { id: true, name: true, email: true, phone: true, addresses: { select: { phone: true, address: true, city: true, isDefault: true } } },
      });
      return NextResponse.json(customers);
    }

    if (type === "orders") {
      const withBalance = searchParams.get("withBalance") === "1";
      const orders = await db.order.findMany({
        where: {
          status: { not: "CANCELLED" },
          ...(search && {
            OR: [
              { orderNumber: contains(search) },
              { phone: { contains: search } },
              { customer: { is: { name: contains(search) } } },
              { invoice: { is: { customerName: contains(search) } } },
            ],
          }),
        },
        orderBy: { createdAt: "desc" },
        take: 30,
        select: {
          id: true,
          orderNumber: true,
          total: true,
          customerId: true,
          customer: { select: { id: true, name: true } },
          invoice: { select: { customerName: true, status: true } },
          payments: { where: { status: { in: COUNTED_PAYMENT_STATUSES } }, select: { amount: true } },
        },
      });

      const rows = orders
        .filter((o) => o.invoice?.status !== "VOID")
        .map((o) => {
          const paid = o.payments.reduce((sum, p) => sum + p.amount, 0);
          return {
            id: o.id,
            orderNumber: o.orderNumber,
            total: o.total,
            paid,
            balance: Math.max(0, o.total - paid),
            customerId: o.customerId,
            customerName: o.customer?.name ?? o.invoice?.customerName ?? "Walk-in",
          };
        })
        .filter((o) => !withBalance || o.balance > 0);

      return NextResponse.json(rows);
    }

    return NextResponse.json({ message: "Unknown lookup type" }, { status: 400 });
  } catch (error) {
    return handleError(error, "Lookup failed");
  }
}
