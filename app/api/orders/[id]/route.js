// app/api/orders/[id]/route.js
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { requireRole, ROLES, handleError, ServiceError, audit } from "@/lib/apiAuth";
import { ORDER_STATUSES, ORDER_TRANSITIONS } from "@/lib/constants";
import { orderInclude as serviceOrderInclude, cancelOrderTx, deleteOrderTx } from "@/lib/orderService";
import { fixOrderInclude, withInvoice } from "@/lib/invoiceLink";

// The service's include may still say `invoice`; the schema now has `invoices`, so patch it here.
const orderInclude = fixOrderInclude(serviceOrderInclude);

export async function GET(request, { params }) {
  try {
    const { error } = await requireRole(ROLES.ORDERS);
    if (error) return error;
    const { id } = await params;

    const order = await db.order.findUnique({ where: { id }, include: orderInclude });
    if (!order) return NextResponse.json({ message: "Order not found" }, { status: 404 });
    return NextResponse.json(withInvoice(order));
  } catch (error) {
    return handleError(error, "Failed to fetch order");
  }
}

// PUT /api/orders/:id  body: { status?, phone?, address?, notes?, refund? }
// Items are locked after checkout (stock was already deducted) - cancel and re-create to change them.
export async function PUT(request, { params }) {
  try {
    const { user, error } = await requireRole(ROLES.ORDERS);
    if (error) return error;
    const { id } = await params;
    const body = await request.json();

    const updated = await db.$transaction(
      async (tx) => {
        const existing = await tx.order.findUnique({ where: { id } });
        if (!existing) throw new ServiceError("Order not found", 404);
        if (existing.status === "CANCELLED") throw new ServiceError("Cancelled orders can't be edited", 409);

        const data = {};
        if (body.phone !== undefined) {
          if (!body.phone.trim()) throw new ServiceError("Phone is required");
          data.phone = body.phone.trim();
        }
        if (body.address !== undefined) {
          if (!body.address.trim()) throw new ServiceError("Address is required");
          data.address = body.address.trim();
        }
        if (body.notes !== undefined) data.notes = body.notes?.trim() || null;

        const nextStatus = body.status;
        if (nextStatus && nextStatus !== existing.status) {
          if (!ORDER_STATUSES.includes(nextStatus)) throw new ServiceError("Invalid status");
          if (!ORDER_TRANSITIONS[existing.status].includes(nextStatus)) {
            throw new ServiceError(`An order can't go from ${existing.status} to ${nextStatus}`, 409);
          }
          if (nextStatus === "CANCELLED" && !ROLES.CANCEL_ORDER.includes(user.role)) {
            throw new ServiceError("Only admin or sales can cancel orders", 403);
          }
        }

        if (Object.keys(data).length) await tx.order.update({ where: { id }, data });

        if (nextStatus && nextStatus !== existing.status) {
          if (nextStatus === "CANCELLED") {
            await cancelOrderTx(tx, id, user.id, { refund: Boolean(body.refund) });
          } else {
            await tx.order.update({ where: { id }, data: { status: nextStatus } });
            await audit(tx, user.id, "ORDER_STATUS", "Order", id, { from: existing.status, to: nextStatus });
          }
        }

        return tx.order.findUnique({ where: { id }, include: orderInclude });
      },
      { timeout: 30000 }
    );

    return NextResponse.json({ data: withInvoice(updated), message: "Order updated successfully" });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user, error } = await requireRole(ROLES.ADMIN_ONLY);
    if (error) return error;
    const { id } = await params;

    await db.$transaction((tx) => deleteOrderTx(tx, id, user.id), { timeout: 30000 });
    return NextResponse.json({ message: "Order deleted" });
  } catch (error) {
    return handleError(error);
  }
}