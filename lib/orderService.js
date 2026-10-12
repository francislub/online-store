// lib/orderService.js
// Route: n/a (server-only business logic for orders; always call inside db.$transaction)
import { ServiceError, toInt, audit } from "@/lib/apiAuth";
import { makeNumber } from "@/lib/numbering";
import { couponDiscount, syncInvoiceBalance, amountPaidFor } from "@/lib/finance";
import { COUNTED_PAYMENT_STATUSES, PAYMENT_METHODS } from "@/lib/constants";

export const orderInclude = {
  customer: { select: { id: true, name: true, email: true, phone: true } },
  items: { include: { product: true } },
  invoice: true,
  payments: { orderBy: { paidAt: "desc" }, include: { recordedBy: { select: { name: true } } } },
  returns: true,
  coupon: true,
};

// Creates an invoice for an order (used at checkout and by "Create invoice" on the order page)
export async function createInvoiceForOrder(tx, order, extra = {}) {
  const existing = await tx.invoice.findUnique({ where: { orderId: order.id } });
  if (existing) throw new ServiceError("This order already has an invoice", 409);

  let customer = null;
  if (order.customerId) {
    customer = await tx.user.findUnique({ where: { id: order.customerId }, select: { name: true, email: true } });
  }

  await tx.invoice.create({
    data: {
      number: makeNumber("INV"),
      orderId: order.id,
      customerName: extra.customerName || customer?.name || null,
      customerEmail: customer?.email ?? null,
      customerTin: extra.customerTin || null,
      subtotal: order.subtotal,
      tax: order.tax,
      discount: order.discount,
      total: order.total,
      amountPaid: 0,
      balance: order.total,
      status: "ISSUED",
      notes: extra.notes ?? order.notes ?? null,
      dueAt: extra.dueAt ? new Date(extra.dueAt) : null,
    },
  });
  return syncInvoiceBalance(tx, order.id);
}

// Checkout: validates stock, locks prices, takes stock out, applies coupon, creates invoice + optional payment
export async function createOrderTx(tx, input, actorId) {
  const { customerId, phone, address, notes, items, couponCode, createInvoice = true, initialPayment } = input;

  if (!phone?.trim() || !address?.trim()) throw new ServiceError("Phone and address are required");
  if (!Array.isArray(items) || items.length === 0) throw new ServiceError("Add at least one item");

  // Merge duplicate product lines
  const wanted = new Map();
  for (const item of items) {
    const quantity = toInt(item.quantity);
    if (!item.productId || quantity <= 0) throw new ServiceError("Every item needs a product and a quantity of 1 or more");
    const prev = wanted.get(item.productId);
    if (prev) prev.quantity += quantity;
    else wanted.set(item.productId, { quantity, unitPrice: item.unitPrice });
  }

  const products = await tx.product.findMany({ where: { id: { in: [...wanted.keys()] } } });
  if (products.length !== wanted.size) throw new ServiceError("One or more products no longer exist", 404);

  const lines = products.map((product) => {
    const { quantity, unitPrice: requested } = wanted.get(product.id);
    if (!product.isActive) throw new ServiceError(`${product.name} is not active`, 409);
    if (product.stock < quantity) {
      throw new ServiceError(`Not enough stock for ${product.name} (available: ${product.stock})`, 409);
    }
    const unitPrice = requested === undefined || requested === null || requested === "" ? product.salePrice ?? product.price : toInt(requested);
    if (unitPrice < 0) throw new ServiceError(`Invalid price for ${product.name}`);
    return { product, quantity, unitPrice, total: unitPrice * quantity };
  });

  const subtotal = lines.reduce((sum, l) => sum + l.total, 0);
  const tax = Math.max(0, toInt(input.tax));
  const manualDiscount = Math.max(0, toInt(input.discount));

  // Coupon
  let coupon = null;
  let couponValue = 0;
  if (couponCode?.trim()) {
    coupon = await tx.coupon.findFirst({ where: { couponCode: { equals: couponCode.trim(), mode: "insensitive" } } });
    if (!coupon || !coupon.isActive) throw new ServiceError("Coupon is not valid", 400);
    if (coupon.expiryDate < new Date()) throw new ServiceError("Coupon has expired", 400);
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) throw new ServiceError("Coupon usage limit reached", 400);
    if (subtotal < coupon.minOrderTotal) {
      throw new ServiceError(`Coupon needs a minimum order of UGX ${coupon.minOrderTotal.toLocaleString()}`, 400);
    }
    couponValue = couponDiscount(coupon, subtotal);
    await tx.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
  }

  const discount = Math.min(subtotal + tax, manualDiscount + couponValue);
  const total = Math.max(0, subtotal + tax - discount);
  const orderNumber = makeNumber("ORD");

  const order = await tx.order.create({
    data: {
      orderNumber,
      customerId: customerId || null,
      status: "PENDING",
      subtotal,
      tax,
      discount,
      total,
      phone: phone.trim(),
      address: address.trim(),
      notes: notes?.trim() || null,
      couponId: coupon?.id ?? null,
      items: {
        create: lines.map((l) => ({
          productId: l.product.id,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          costPrice: l.product.costPrice, // snapshot so profit reports stay correct later
          total: l.total,
        })),
      },
    },
  });

  // Take stock out (guarded so two cashiers can't oversell the same unit) + movement log
  for (const l of lines) {
    const res = await tx.product.updateMany({
      where: { id: l.product.id, stock: { gte: l.quantity } },
      data: { stock: { decrement: l.quantity } },
    });
    if (res.count !== 1) throw new ServiceError(`Stock for ${l.product.name} just changed, please retry`, 409);
    await tx.stockMovement.create({
      data: {
        productId: l.product.id,
        type: "SALE",
        quantity: -l.quantity,
        balanceAfter: l.product.stock - l.quantity,
        reference: orderNumber,
        notes: "Order sale",
        createdById: actorId,
      },
    });
  }

  if (createInvoice) {
    await createInvoiceForOrder(tx, order, {
      customerName: input.customerName,
      customerTin: input.customerTin,
      dueAt: input.dueAt,
    });
  }

  // Optional payment taken at the counter
  const payAmount = toInt(initialPayment?.amount);
  if (payAmount > 0) {
    if (payAmount > total) throw new ServiceError("Payment is more than the order total");
    const method = PAYMENT_METHODS.includes(initialPayment.method) ? initialPayment.method : "CASH";
    await tx.payment.create({
      data: {
        reference: makeNumber("PAY"),
        orderId: order.id,
        customerId: customerId || null,
        recordedById: actorId,
        amount: payAmount,
        method,
        status: payAmount >= total ? "PAID" : "PARTIAL",
        notes: "Taken at order creation",
      },
    });
    await syncInvoiceBalance(tx, order.id);
  }

  await audit(tx, actorId, "ORDER_CREATED", "Order", order.id, { orderNumber, total, items: lines.length });
  return tx.order.findUnique({ where: { id: order.id }, include: orderInclude });
}

// Put stock + coupon usage back (used by cancel and delete)
async function releaseOrder(tx, order, actorId, note) {
  for (const item of order.items) {
    const updated = await tx.product.update({
      where: { id: item.productId },
      data: { stock: { increment: item.quantity } },
      select: { stock: true },
    });
    await tx.stockMovement.create({
      data: {
        productId: item.productId,
        type: "ADJUSTMENT",
        quantity: item.quantity,
        balanceAfter: updated.stock,
        reference: order.orderNumber,
        notes: note,
        createdById: actorId,
      },
    });
  }
  if (order.couponId) {
    await tx.coupon.updateMany({ where: { id: order.couponId, usedCount: { gt: 0 } }, data: { usedCount: { decrement: 1 } } });
  }
}

export async function cancelOrderTx(tx, id, actorId, { refund = false } = {}) {
  const order = await tx.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) throw new ServiceError("Order not found", 404);
  if (order.status === "CANCELLED") throw new ServiceError("Order is already cancelled", 409);
  if (order.status === "COMPLETED") {
    throw new ServiceError("Completed orders can't be cancelled. Create a return instead.", 409);
  }

  const paid = await amountPaidFor(tx, id);
  if (paid > 0 && !refund) {
    throw new ServiceError(`This order has UGX ${paid.toLocaleString()} paid. Confirm the refund to cancel it.`, 409);
  }
  if (paid > 0) {
    await tx.payment.updateMany({
      where: { orderId: id, status: { in: COUNTED_PAYMENT_STATUSES } },
      data: { status: "REFUNDED" },
    });
  }

  await releaseOrder(tx, order, actorId, "Order cancelled");
  await tx.invoice.updateMany({ where: { orderId: id }, data: { status: "VOID", balance: 0 } });
  await tx.order.update({ where: { id }, data: { status: "CANCELLED" } });
  await audit(tx, actorId, "ORDER_CANCELLED", "Order", id, { orderNumber: order.orderNumber, refunded: paid });
}

export async function deleteOrderTx(tx, id, actorId) {
  const order = await tx.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) throw new ServiceError("Order not found", 404);

  const [payments, returns] = await Promise.all([
    tx.payment.count({ where: { orderId: id } }),
    tx.return.count({ where: { orderId: id } }),
  ]);
  if (payments > 0 || returns > 0) {
    throw new ServiceError(`${order.orderNumber} has payments or returns, so it can't be deleted. Cancel it instead.`, 409);
  }

  if (order.status !== "CANCELLED") await releaseOrder(tx, order, actorId, "Order deleted");
  await tx.invoice.deleteMany({ where: { orderId: id } });
  await tx.orderItem.deleteMany({ where: { orderId: id } });
  await tx.order.delete({ where: { id } });
  await audit(tx, actorId, "ORDER_DELETED", "Order", id, { orderNumber: order.orderNumber });
}
