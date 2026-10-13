// app/api/orders/[id]/route.js
// Route: /api/orders/:id  (GET one order, PUT update/cancel, DELETE remove - admin only)
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { requireRole, ROLES, handleError, ServiceError, audit } from "@/lib/apiAuth";
import { ORDER_STATUSES, ORDER_TRANSITIONS } from "@/lib/constants";
import { orderInclude as serviceOrderInclude, cancelOrderTx } from "@/lib/orderService";
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

/**
 * Delete an order together with everything linked to it, so a foreign-key style
 * "still has related records" error can never block the delete.
 *
 *  - order items, returns (and their items)      -> deleted
 *  - invoices (and their items), payments        -> deleted, or kept and detached
 *                                                   (orderId = null) when keepRecords is true
 *  - stock                                       -> put back for orders that were not cancelled
 *                                                   (a cancelled order already restored it)
 *  - coupon usage                                -> decremented for orders that were not cancelled
 *
 * Everything runs in the caller's transaction, so it is all-or-nothing.
 */
async function deleteOrderCascade(tx, id, userId, { keepRecords = false } = {}) {
  const order = await tx.order.findUnique({
    where: { id },
    include: {
      items: true,
      invoices: { select: { id: true } },
      payments: { select: { id: true } },
      returns: { select: { id: true } },
    },
  });
  if (!order) throw new ServiceError("Order not found", 404);

  const wasCancelled = order.status === "CANCELLED";

  // 1) Put stock back (and log it) if the order still holds stock.
  if (!wasCancelled) {
    for (const item of order.items) {
      const product = await tx.product.findUnique({ where: { id: item.productId }, select: { stock: true } });
      if (!product) continue;
      await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          type: "ADJUSTMENT",
          quantity: item.quantity,
          balanceAfter: product.stock + item.quantity,
          reference: order.orderNumber,
          notes: "Order deleted: stock put back",
          createdById: userId,
        },
      });
    }

    // Free up the coupon use this order consumed.
    if (order.couponId) {
      await tx.coupon.updateMany({
        where: { id: order.couponId, usedCount: { gt: 0 } },
        data: { usedCount: { decrement: 1 } },
      });
    }
  }

  // 2) Returns and their items.
  const returnIds = order.returns.map((r) => r.id);
  if (returnIds.length) {
    await tx.returnItem.deleteMany({ where: { returnId: { in: returnIds } } });
    await tx.return.deleteMany({ where: { orderId: id } });
  }

  // 3) Invoices (+ items) and payments.
  const invoiceIds = order.invoices.map((i) => i.id);
  if (keepRecords) {
    if (invoiceIds.length) await tx.invoice.updateMany({ where: { orderId: id }, data: { orderId: null } });
    if (order.payments.length) await tx.payment.updateMany({ where: { orderId: id }, data: { orderId: null } });
  } else {
    if (invoiceIds.length) {
      await tx.invoiceItem.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
      await tx.invoice.deleteMany({ where: { orderId: id } });
    }
    if (order.payments.length) await tx.payment.deleteMany({ where: { orderId: id } });
  }

  // 4) The order itself.
  await tx.orderItem.deleteMany({ where: { orderId: id } });
  await tx.order.delete({ where: { id } });

  const summary = {
    orderNumber: order.orderNumber,
    status: order.status,
    total: order.total,
    items: order.items.length,
    returns: returnIds.length,
    invoices: invoiceIds.length,
    payments: order.payments.length,
    recordsKept: keepRecords,
    stockRestored: !wasCancelled,
  };
  await audit(tx, userId, "ORDER_DELETE", "Order", id, summary);
  return summary;
}

// DELETE /api/orders/:id            -> removes the order and everything linked to it
// DELETE /api/orders/:id?keepRecords=true -> keeps invoices and payments, only detaches them from the order
export async function DELETE(request, { params }) {
  try {
    const { user, error } = await requireRole(ROLES.ADMIN_ONLY);
    if (error) return error;
    const { id } = await params;

    const keepRecords = new URL(request.url).searchParams.get("keepRecords") === "true";

    const summary = await db.$transaction((tx) => deleteOrderCascade(tx, id, user.id, { keepRecords }), {
      timeout: 30000,
    });

    return NextResponse.json({ message: `Order ${summary.orderNumber} deleted`, data: summary });
  } catch (error) {
    return handleError(error, "Failed to delete order");
  }
}