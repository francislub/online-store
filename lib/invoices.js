// File: src/lib/invoices.js
// Route: n/a (server-side invoice helpers used by the /api/invoices routes)
import db from "@/lib/db";
import { calcTotals, lineTotal } from "@/lib/invoiceFormat";

export { calcTotals, lineTotal };

// Safe number parser: undefined / "" / NaN fall back to `fallback`
export const num = (value, fallback = 0) => {
  if (value === undefined || value === null || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

// Sum of money actually received on an order
export const paidTotal = (payments = []) =>
  payments
    .filter((p) => ["PAID", "PARTIAL"].includes(p.status))
    .reduce((sum, p) => sum + (p.amount || 0), 0);

// What to load with an invoice
export const INVOICE_INCLUDE = {
  order: { select: { orderNumber: true, phone: true, address: true } },
  items: { orderBy: { position: "asc" } },
};

// ISSUED / SENT invoices that are past their due date and still owe money are shown as OVERDUE
export function withDisplayStatus(invoice) {
  if (
    invoice &&
    ["ISSUED", "SENT"].includes(invoice.status) &&
    invoice.balance > 0 &&
    invoice.dueAt &&
    new Date(invoice.dueAt) < new Date()
  ) {
    return { ...invoice, status: "OVERDUE" };
  }
  return invoice;
}

// INV-2026-0001, INV-2026-0002 ...
export async function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  let seq = (await db.invoice.count()) + 1;
  for (let i = 0; i < 50; i++, seq++) {
    const number = `INV-${year}-${String(seq).padStart(4, "0")}`;
    const taken = await db.invoice.findUnique({ where: { number } });
    if (!taken) return number;
  }
  return `INV-${year}-${Date.now()}`;
}

// Turns a raw items array from the form into clean rows ready for Prisma.
// Returns { items } or { error }.
export function normalizeItems(raw) {
  if (!Array.isArray(raw)) return { items: [] };
  const items = [];
  for (let index = 0; index < raw.length; index++) {
    const row = raw[index] || {};
    const description = String(row.description ?? "").trim();
    const quantity = Math.round(num(row.quantity, 0));
    const unitPrice = Math.round(num(row.unitPrice, 0));
    if (!description) return { error: `Item ${index + 1}: enter a product / description` };
    if (quantity <= 0) return { error: `Item ${index + 1}: quantity must be at least 1` };
    if (unitPrice < 0) return { error: `Item ${index + 1}: price cannot be negative` };
    items.push({
      productId: row.productId || null,
      position: index,
      description,
      details: String(row.details ?? "").trim() || null,
      quantity,
      unitPrice,
      total: lineTotal(quantity, unitPrice),
    });
  }
  return { items };
}

// Order line -> invoice line (used when an invoice is built from an order)
export function itemsFromOrder(order) {
  return (order.items ?? []).map((item, index) => ({
    productId: item.productId || null,
    position: index,
    description: item.product?.name ?? "Item",
    details:
      [item.product?.brand, item.product?.model, item.product?.sku && `SKU: ${item.product.sku}`]
        .filter(Boolean)
        .join(" • ") || null,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    total: item.total ?? lineTotal(item.quantity, item.unitPrice),
  }));
}
