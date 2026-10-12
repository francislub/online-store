// app/api/orders/route.js
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { requireRole, ROLES, handleError, dateRange, ServiceError } from "@/lib/apiAuth";
import { ORDER_STATUSES } from "@/lib/constants";
import { createOrderTx, deleteOrderTx } from "@/lib/orderService";
import { ORDER_LIST_INVOICE_ARGS, invoiceSearch, withInvoice } from "@/lib/invoiceLink";

// GET /api/orders?search=&status=&from=&to=&customerId=
export async function GET(request) {
  try {
    const { error } = await requireRole(ROLES.ORDERS);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();
    const status = searchParams.get("status");
    const customerId = searchParams.get("customerId");
    const range = dateRange(searchParams.get("from"), searchParams.get("to"));

    const where = {};
    if (status && ORDER_STATUSES.includes(status)) where.status = status;
    if (customerId) where.customerId = customerId;
    if (range) where.createdAt = range;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { customer: { is: { name: { contains: search, mode: "insensitive" } } } },
        // an order can now have several invoices (e.g. a voided one + its replacement)
        ...invoiceSearch(search),
      ];
    }

    const orders = await db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 1000,
      include: {
        customer: { select: { id: true, name: true, email: true } },
        // newest non-void invoice only; flattened back to `order.invoice` below
        invoices: ORDER_LIST_INVOICE_ARGS,
        _count: { select: { items: true } },
      },
    });

    return NextResponse.json(orders.map(withInvoice));
  } catch (error) {
    return handleError(error, "Failed to fetch orders");
  }
}

// POST /api/orders  -> checkout (stock out, coupon, invoice, optional payment) in ONE transaction
export async function POST(request) {
  try {
    const { user, error } = await requireRole(ROLES.ORDERS);
    if (error) return error;

    const body = await request.json();
    const order = await db.$transaction((tx) => createOrderTx(tx, body, user.id), { timeout: 30000 });

    return NextResponse.json({ data: order, message: "Order created successfully" }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

// DELETE /api/orders  body: { ids: [] }  (admin only)
export async function DELETE(request) {
  try {
    const { user, error } = await requireRole(ROLES.ADMIN_ONLY);
    if (error) return error;

    const { ids } = await request.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ message: "No orders selected" }, { status: 400 });
    }

    let deleted = 0;
    const skipped = [];
    for (const id of ids) {
      try {
        await db.$transaction((tx) => deleteOrderTx(tx, id, user.id), { timeout: 30000 });
        deleted += 1;
      } catch (err) {
        if (err instanceof ServiceError) skipped.push(err.message);
        else throw err;
      }
    }

    if (deleted === 0) return NextResponse.json({ message: skipped[0] ?? "Nothing deleted" }, { status: 409 });
    const note = skipped.length ? `, ${skipped.length} skipped (they have payments or returns)` : "";
    return NextResponse.json({ message: `${deleted} order(s) deleted${note}` });
  } catch (error) {
    return handleError(error);
  }
}