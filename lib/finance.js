// lib/finance.js
// Route: n/a (money rules shared by orders, invoices and payments)
import { COUNTED_PAYMENT_STATUSES } from "@/lib/constants";

export function couponDiscount(coupon, subtotal) {
  const raw =
    coupon.discountType === "PERCENTAGE"
      ? Math.round((subtotal * coupon.discountValue) / 100)
      : coupon.discountValue;
  return Math.min(subtotal, raw);
}

// Total of money actually received for an order (optionally ignoring one payment, used when editing it)
export async function amountPaidFor(tx, orderId, excludePaymentId = null) {
  const result = await tx.payment.aggregate({
    where: {
      orderId,
      status: { in: COUNTED_PAYMENT_STATUSES },
      ...(excludePaymentId ? { id: { not: excludePaymentId } } : {}),
    },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
}

// Re-calculate invoice amountPaid / balance / status from the payments table.
// Call this after ANY payment is created, edited or deleted.
export async function syncInvoiceBalance(tx, orderId) {
  if (!orderId) return null;
  const invoice = await tx.invoice.findUnique({ where: { orderId } });
  if (!invoice || invoice.status === "VOID") return invoice;

  const amountPaid = await amountPaidFor(tx, orderId);
  const balance = Math.max(0, invoice.total - amountPaid);

  let status = invoice.status;
  if (balance === 0 && invoice.total > 0) status = "PAID";
  else if (status === "PAID") status = "ISSUED"; // a payment was removed/reduced
  else if (invoice.dueAt && invoice.dueAt < new Date() && ["ISSUED", "SENT"].includes(status)) status = "OVERDUE";

  return tx.invoice.update({ where: { id: invoice.id }, data: { amountPaid, balance, status } });
}
