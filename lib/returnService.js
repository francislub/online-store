// lib/returnService.js
// Route: n/a (server-only business logic for returns; always call inside db.$transaction)
import { ServiceError, ROLES, toInt, audit } from "@/lib/apiAuth";
import { makeNumber } from "@/lib/numbering";
import { amountPaidFor } from "@/lib/finance";
import { PAYMENT_METHODS, RETURN_TRANSITIONS, RETURNABLE_ORDER_STATUSES } from "@/lib/constants";

export const returnInclude = {
  order: {
    select: {
      id: true,
      orderNumber: true,
      status: true,
      total: true,
      phone: true,
      customer: { select: { id: true, name: true, phone: true } },
      invoice: { select: { id: true, number: true, customerName: true } },
    },
  },
  items: { include: { product: { select: { id: true, name: true, sku: true } } } },
};

// What was sold on the order, what is already coming back (rejected returns don't count), what is left.
// netUnit = unit price after the order-level discount is spread over the goods, so refunds stay fair.
export async function returnableLines(client, orderId, excludeReturnId = null) {
  const order = await client.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: { select: { name: true, sku: true } } } } },
  });
  if (!order) throw new ServiceError("Order not found", 404);

  const prior = await client.returnItem.findMany({
    where: {
      return: {
        is: { orderId, status: { not: "REJECTED" }, ...(excludeReturnId ? { id: { not: excludeReturnId } } : {}) },
      },
    },
    select: { productId: true, quantity: true },
  });
  const returned = new Map();
  prior.forEach((r) => returned.set(r.productId, (returned.get(r.productId) ?? 0) + r.quantity));

  const ratio = order.subtotal > 0 ? Math.max(0, order.subtotal - order.discount) / order.subtotal : 1;

  const lines = order.items.map((item) => {
    const already = returned.get(item.productId) ?? 0;
    return {
      productId: item.productId,
      name: item.product?.name ?? "Deleted product",
      sku: item.product?.sku ?? "",
      sold: item.quantity,
      returned: already,
      available: Math.max(0, item.quantity - already),
      unitPrice: item.unitPrice,
      netUnit: item.unitPrice * ratio,
    };
  });

  return {
    order: { id: order.id, orderNumber: order.orderNumber, status: order.status, subtotal: order.subtotal, discount: order.discount, total: order.total },
    lines,
  };
}

// Validates requested quantities against what is returnable and prices each line
function priceItems(lines, requested) {
  const byProduct = new Map(lines.map((l) => [l.productId, l]));
  const merged = new Map();
  for (const r of requested ?? []) {
    const qty = toInt(r.quantity);
    if (qty <= 0) continue;
    merged.set(r.productId, (merged.get(r.productId) ?? 0) + qty);
  }
  if (merged.size === 0) throw new ServiceError("Select at least one item to return");

  return [...merged.entries()].map(([productId, quantity]) => {
    const line = byProduct.get(productId);
    if (!line) throw new ServiceError("A selected product is not on this order", 400);
    if (quantity > line.available) {
      throw new ServiceError(`Only ${line.available} of ${line.name} can still be returned`, 409);
    }
    return { productId, quantity, amount: Math.round(line.netUnit * quantity) };
  });
}

function checkRefund(value, itemsTotal) {
  const refund = toInt(value, itemsTotal);
  if (refund < 0) throw new ServiceError("Refund can't be negative");
  if (refund > itemsTotal) {
    throw new ServiceError(`Refund can't be more than the value of the returned items (UGX ${itemsTotal.toLocaleString()})`, 409);
  }
  return refund;
}

export async function createReturnTx(tx, input, actorId) {
  if (!input.orderId) throw new ServiceError("Select an order");
  if (!input.reason?.trim()) throw new ServiceError("Reason is required");

  const { order, lines } = await returnableLines(tx, input.orderId);
  if (!RETURNABLE_ORDER_STATUSES.includes(order.status)) {
    throw new ServiceError("Only shipped or completed orders can have returns", 409);
  }

  const items = priceItems(lines, input.items);
  const itemsTotal = items.reduce((sum, i) => sum + i.amount, 0);
  const refundAmount = input.refundAmount === undefined || input.refundAmount === "" ? itemsTotal : checkRefund(input.refundAmount, itemsTotal);

  const created = await tx.return.create({
    data: {
      reference: makeNumber("RET"),
      orderId: order.id,
      status: "REQUESTED",
      reason: input.reason.trim(),
      refundAmount,
      notes: input.notes?.trim() || null,
      items: { create: items },
    },
  });
  await audit(tx, actorId, "RETURN_CREATED", "Return", created.id, { reference: created.reference, order: order.orderNumber, refundAmount });
  return tx.return.findUnique({ where: { id: created.id }, include: returnInclude });
}

// Edit details while the return is still open (items only before approval)
export async function updateReturnTx(tx, id, input, actorId) {
  const existing = await tx.return.findUnique({ where: { id }, include: { items: true } });
  if (!existing) throw new ServiceError("Return not found", 404);
  if (!["REQUESTED", "APPROVED"].includes(existing.status)) {
    throw new ServiceError("This return is already being processed and can't be edited", 409);
  }

  const data = {};
  if (input.reason !== undefined) {
    if (!input.reason.trim()) throw new ServiceError("Reason is required");
    data.reason = input.reason.trim();
  }
  if (input.notes !== undefined) data.notes = input.notes?.trim() || null;

  let itemsTotal = existing.items.reduce((sum, i) => sum + i.amount, 0);
  let newItems = null;
  if (input.items) {
    if (existing.status !== "REQUESTED") throw new ServiceError("Items can only be changed before approval", 409);
    const { lines } = await returnableLines(tx, existing.orderId, id);
    newItems = priceItems(lines, input.items);
    itemsTotal = newItems.reduce((sum, i) => sum + i.amount, 0);
    data.refundAmount = input.refundAmount === undefined ? itemsTotal : checkRefund(input.refundAmount, itemsTotal);
  } else if (input.refundAmount !== undefined) {
    data.refundAmount = checkRefund(input.refundAmount, itemsTotal);
  }

  if (newItems) {
    await tx.returnItem.deleteMany({ where: { returnId: id } });
    await tx.returnItem.createMany({ data: newItems.map((i) => ({ ...i, returnId: id })) });
  }
  await tx.return.update({ where: { id }, data });
  await audit(tx, actorId, "RETURN_UPDATED", "Return", id, { reference: existing.reference, changes: Object.keys(data) });
  return tx.return.findUnique({ where: { id }, include: returnInclude });
}

// Moves a return through its workflow and performs the stock / money side effects
export async function transitionReturnTx(tx, id, input, actorId, role) {
  const ret = await tx.return.findUnique({ where: { id }, include: { items: true, order: true } });
  if (!ret) throw new ServiceError("Return not found", 404);

  const status = input.status;
  if (!(RETURN_TRANSITIONS[ret.status] ?? []).includes(status)) {
    throw new ServiceError(`A return can't go from ${ret.status} to ${status}`, 409);
  }
  if (!ROLES.RETURN_STEPS[status]?.includes(role)) {
    throw new ServiceError(`Your role can't mark a return as ${status.toLowerCase()}`, 403);
  }

  if (status === "RECEIVED") {
    // Good items go back on the shelf, damaged ones are logged but not restocked
    const damaged = input.condition === "DAMAGED";
    for (const item of ret.items) {
      let balanceAfter;
      if (damaged) {
        balanceAfter = (await tx.product.findUnique({ where: { id: item.productId }, select: { stock: true } }))?.stock ?? 0;
      } else {
        const updated = await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } }, select: { stock: true } });
        balanceAfter = updated.stock;
      }
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          type: damaged ? "DAMAGED" : "RETURN_IN",
          quantity: damaged ? 0 : item.quantity,
          balanceAfter,
          reference: ret.reference,
          notes: damaged ? `Returned damaged x${item.quantity} (not restocked)` : "Customer return",
          createdById: actorId,
        },
      });
    }
  }

  if (status === "REFUNDED" && ret.refundAmount > 0) {
    const method = PAYMENT_METHODS.includes(input.method) ? input.method : "CASH";
    const [paid, refundedAgg] = await Promise.all([
      amountPaidFor(tx, ret.orderId),
      tx.payment.aggregate({ where: { orderId: ret.orderId, status: "REFUNDED" }, _sum: { amount: true } }),
    ]);
    const available = paid - (refundedAgg._sum.amount ?? 0);
    if (ret.refundAmount > available) {
      throw new ServiceError(
        `Only UGX ${Math.max(0, available).toLocaleString()} was paid on this order and not yet refunded. Lower the refund amount first.`,
        409
      );
    }
    await tx.payment.create({
      data: {
        reference: makeNumber("PAY"),
        orderId: ret.orderId,
        customerId: ret.order.customerId,
        recordedById: actorId,
        amount: ret.refundAmount,
        method,
        status: "REFUNDED",
        notes: `Refund for return ${ret.reference}`,
      },
    });
  }

  if (status === "REPLACED") {
    // Give the customer new units: stock goes out again (guarded against overselling)
    for (const item of ret.items) {
      const res = await tx.product.updateMany({
        where: { id: item.productId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      if (res.count !== 1) {
        const product = await tx.product.findUnique({ where: { id: item.productId }, select: { name: true, stock: true } });
        throw new ServiceError(`Not enough stock to replace ${product?.name ?? "item"} (available: ${product?.stock ?? 0})`, 409);
      }
      const after = await tx.product.findUnique({ where: { id: item.productId }, select: { stock: true } });
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          type: "SALE",
          quantity: -item.quantity,
          balanceAfter: after.stock,
          reference: ret.reference,
          notes: "Replacement issued for return",
          createdById: actorId,
        },
      });
    }
  }

  const note = input.notes?.trim();
  await tx.return.update({
    where: { id },
    data: { status, ...(note ? { notes: [ret.notes, note].filter(Boolean).join("\n") } : {}) },
  });
  await audit(tx, actorId, "RETURN_STATUS", "Return", id, { reference: ret.reference, from: ret.status, to: status });
  return tx.return.findUnique({ where: { id }, include: returnInclude });
}

// Only returns that haven't touched stock or money can be deleted
export async function deleteReturnsTx(tx, ids, actorId) {
  const rows = await tx.return.findMany({ where: { id: { in: ids } } });
  const deletable = rows.filter((r) => ["REQUESTED", "REJECTED"].includes(r.status));
  if (deletable.length === 0) {
    throw new ServiceError("Only requested or rejected returns can be deleted. Processed returns are kept for the records.", 409);
  }
  const keep = deletable.map((r) => r.id);
  await tx.returnItem.deleteMany({ where: { returnId: { in: keep } } });
  await tx.return.deleteMany({ where: { id: { in: keep } } });
  await audit(tx, actorId, "RETURN_DELETED", "Return", null, { references: deletable.map((r) => r.reference) });
  return { deleted: deletable.length, skipped: ids.length - deletable.length };
}
