// lib/paymentService.js
// Route: n/a (server-only business logic for payments; always call inside db.$transaction)
import { ServiceError, toInt, audit } from "@/lib/apiAuth";
import { makeNumber } from "@/lib/numbering";
import { amountPaidFor, syncInvoiceBalance } from "@/lib/finance";
import { COUNTED_PAYMENT_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES } from "@/lib/constants";

export const paymentInclude = {
  order: { select: { id: true, orderNumber: true, total: true, status: true } },
  customer: { select: { id: true, name: true, phone: true } },
  recordedBy: { select: { id: true, name: true } },
};

async function loadPayableOrder(tx, orderId) {
  const order = await tx.order.findUnique({ where: { id: orderId }, include: { invoice: true } });
  if (!order) throw new ServiceError("Order not found", 404);
  if (order.status === "CANCELLED") throw new ServiceError("This order is cancelled", 409);
  if (order.invoice?.status === "VOID") throw new ServiceError("This order's invoice is void", 409);
  return order;
}

export async function recordPaymentTx(tx, input, actorId) {
  const amount = toInt(input.amount);
  if (amount <= 0) throw new ServiceError("Amount must be greater than zero");
  if (!PAYMENT_METHODS.includes(input.method)) throw new ServiceError("Choose a payment method");

  let status = input.status && input.status !== "AUTO" ? input.status : null;
  if (status && !["PENDING", "PARTIAL", "PAID"].includes(status)) {
    throw new ServiceError("New payments can be Pending, Partial or Paid");
  }

  let order = null;
  let customerId = input.customerId || null;

  if (input.orderId) {
    order = await loadPayableOrder(tx, input.orderId);
    customerId = order.customerId ?? customerId;

    const outstanding = Math.max(0, order.total - (await amountPaidFor(tx, order.id)));
    if (status !== "PENDING" && amount > outstanding) {
      throw new ServiceError(`Amount is more than the outstanding balance (UGX ${outstanding.toLocaleString()})`, 409);
    }
    if (!status) status = amount >= outstanding ? "PAID" : "PARTIAL";
  } else {
    if (!customerId) throw new ServiceError("Select an order or a customer");
    if (!status) status = "PAID";
  }

  const payment = await tx.payment.create({
    data: {
      reference: makeNumber("PAY"),
      orderId: order?.id ?? null,
      customerId,
      recordedById: actorId,
      amount,
      method: input.method,
      status,
      notes: input.notes?.trim() || null,
      paidAt: input.paidAt ? new Date(input.paidAt) : new Date(),
    },
  });

  await syncInvoiceBalance(tx, order?.id);
  await audit(tx, actorId, "PAYMENT_RECORDED", "Payment", payment.id, { reference: payment.reference, amount, method: input.method });
  return tx.payment.findUnique({ where: { id: payment.id }, include: paymentInclude });
}

export async function updatePaymentTx(tx, id, input, actorId) {
  const existing = await tx.payment.findUnique({ where: { id } });
  if (!existing) throw new ServiceError("Payment not found", 404);

  const data = {};
  if (input.amount !== undefined) {
    const amount = toInt(input.amount);
    if (amount <= 0) throw new ServiceError("Amount must be greater than zero");
    data.amount = amount;
  }
  if (input.method !== undefined) {
    if (!PAYMENT_METHODS.includes(input.method)) throw new ServiceError("Invalid payment method");
    data.method = input.method;
  }
  if (input.status !== undefined) {
    if (!PAYMENT_STATUSES.includes(input.status)) throw new ServiceError("Invalid payment status");
    data.status = input.status;
  }
  if (input.notes !== undefined) data.notes = input.notes?.trim() || null;
  if (input.paidAt) data.paidAt = new Date(input.paidAt);

  const nextAmount = data.amount ?? existing.amount;
  const nextStatus = data.status ?? existing.status;

  if (existing.orderId && COUNTED_PAYMENT_STATUSES.includes(nextStatus)) {
    const order = await loadPayableOrder(tx, existing.orderId);
    const outstanding = Math.max(0, order.total - (await amountPaidFor(tx, order.id, id)));
    if (nextAmount > outstanding) {
      throw new ServiceError(`Amount is more than the outstanding balance (UGX ${outstanding.toLocaleString()})`, 409);
    }
  }

  await tx.payment.update({ where: { id }, data });
  await syncInvoiceBalance(tx, existing.orderId);
  await audit(tx, actorId, "PAYMENT_UPDATED", "Payment", id, { reference: existing.reference, changes: Object.keys(data) });
  return tx.payment.findUnique({ where: { id }, include: paymentInclude });
}

export async function deletePaymentsTx(tx, ids, actorId) {
  const payments = await tx.payment.findMany({ where: { id: { in: ids } } });
  if (payments.length === 0) throw new ServiceError("Payment not found", 404);

  await tx.payment.deleteMany({ where: { id: { in: payments.map((p) => p.id) } } });
  const orderIds = [...new Set(payments.map((p) => p.orderId).filter(Boolean))];
  for (const orderId of orderIds) await syncInvoiceBalance(tx, orderId);

  await audit(tx, actorId, "PAYMENT_DELETED", "Payment", null, { references: payments.map((p) => p.reference) });
  return payments.length;
}
