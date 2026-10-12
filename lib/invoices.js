// lib/invoices.js
// Route: n/a (shared server helpers for invoices)
import db from "@/lib/db";

export const num = (value, fallback = 0) =>
  value === undefined || value === null || value === "" ? fallback : Number(value) || 0;

// Sum of money actually received against an order
export function paidTotal(payments = []) {
  return payments
    .filter((p) => p.status === "PAID" || p.status === "PARTIAL")
    .reduce((sum, p) => sum + p.amount, 0);
}

// Next number: INV-0001, INV-0002 ... (based on the highest existing number)
export async function generateInvoiceNumber() {
  const recent = await db.invoice.findMany({
    select: { number: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  let max = 0;
  for (const i of recent) {
    const n = parseInt(String(i.number).replace(/\D/g, ""), 10);
    if (n > max) max = n;
  }
  return `INV-${String(max + 1).padStart(4, "0")}`;
}

// OVERDUE is derived, never stored: unpaid + past due date
export function withDisplayStatus(invoice) {
  if (!invoice) return invoice;
  const overdue =
    ["ISSUED", "SENT"].includes(invoice.status) &&
    invoice.balance > 0 &&
    invoice.dueAt &&
    new Date(invoice.dueAt) < new Date();
  return overdue ? { ...invoice, status: "OVERDUE" } : invoice;
}

export const INVOICE_INCLUDE = {
  order: {
    include: {
      customer: { select: { name: true, email: true, phone: true } },
      items: {
        include: { product: { select: { name: true, sku: true, brand: true, model: true } } },
      },
    },
  },
};