// app/api/orders/[id]/invoice/route.js
// Creates an invoice for an order that doesn't have one yet
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { requireRole, ROLES, handleError, ServiceError, audit } from "@/lib/apiAuth";
import { createInvoiceForOrder } from "@/lib/orderService";

export async function POST(request, { params }) {
  try {
    const { user, error } = await requireRole(ROLES.ORDERS);
    if (error) return error;
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const invoice = await db.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id } });
      if (!order) throw new ServiceError("Order not found", 404);
      if (order.status === "CANCELLED") throw new ServiceError("Cancelled orders can't be invoiced", 409);
      const created = await createInvoiceForOrder(tx, order, body);
      await audit(tx, user.id, "INVOICE_CREATED", "Invoice", created.id, { number: created.number, order: order.orderNumber });
      return created;
    });

    return NextResponse.json({ data: invoice, message: "Invoice created successfully" }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
