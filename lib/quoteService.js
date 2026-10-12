// lib/quoteService.js
// Route: n/a (server-only business logic for quotes)
import { ServiceError, toInt, audit } from "@/lib/apiAuth";
import { createOrderTx } from "@/lib/orderService";

// Turns [{productId, quantity, unitPrice?}] into saved quote lines with name/sku snapshots
export async function buildQuoteLines(client, items) {
  if (!Array.isArray(items) || items.length === 0) throw new ServiceError("Add at least one item");

  const ids = [...new Set(items.map((i) => i.productId))];
  const products = await client.product.findMany({ where: { id: { in: ids } } });
  const byId = new Map(products.map((p) => [p.id, p]));

  const lines = items.map((item) => {
    const product = byId.get(item.productId);
    if (!product) throw new ServiceError("One or more products no longer exist", 404);
    const quantity = toInt(item.quantity);
    if (quantity <= 0) throw new ServiceError(`Invalid quantity for ${product.name}`);
    const hasPrice = item.unitPrice !== undefined && item.unitPrice !== null && item.unitPrice !== "";
    const unitPrice = hasPrice ? toInt(item.unitPrice) : product.salePrice ?? product.price;
    if (unitPrice < 0) throw new ServiceError(`Invalid price for ${product.name}`);
    return { productId: product.id, name: product.name, sku: product.sku, quantity, unitPrice, total: unitPrice * quantity };
  });

  return { lines, subtotal: lines.reduce((sum, l) => sum + l.total, 0) };
}

export function quoteTotals(subtotal, tax, discount) {
  const t = Math.max(0, toInt(tax));
  const d = Math.max(0, toInt(discount));
  return { tax: t, discount: d, total: Math.max(0, subtotal + t - d) };
}

// Quote -> Order. Reuses checkout so stock, invoice, audit trail all behave the same.
export async function convertQuoteTx(tx, id, input, actorId) {
  const quote = await tx.quote.findUnique({ where: { id }, include: { customer: true } });
  if (!quote) throw new ServiceError("Quote not found", 404);
  if (quote.status === "CONVERTED") throw new ServiceError("This quote was already converted", 409);
  if (["REJECTED", "EXPIRED"].includes(quote.status)) throw new ServiceError(`A ${quote.status.toLowerCase()} quote can't be converted`, 409);
  if (quote.status !== "ACCEPTED" && quote.validUntil && quote.validUntil < new Date()) {
    throw new ServiceError("This quote has expired. Mark it accepted or extend the validity date first.", 409);
  }

  let phone = input.phone;
  let address = input.address;
  if (quote.customerId && (!phone || !address)) {
    const saved =
      (await tx.address.findFirst({ where: { userId: quote.customerId, isDefault: true } })) ??
      (await tx.address.findFirst({ where: { userId: quote.customerId } }));
    phone = phone || saved?.phone || quote.customer?.phone;
    address = address || saved?.address;
  }

  const order = await createOrderTx(
    tx,
    {
      customerId: quote.customerId,
      customerName: quote.customer?.name,
      phone,
      address,
      notes: `Converted from quote ${quote.number}`,
      items: quote.items.map((i) => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice })),
      tax: quote.tax,
      discount: quote.discount,
      createInvoice: input.createInvoice !== false,
      dueAt: input.dueAt,
    },
    actorId
  );

  await tx.quote.update({
    where: { id },
    data: { status: "CONVERTED", notes: [quote.notes, `Converted to order ${order.orderNumber}`].filter(Boolean).join("\n") },
  });
  await audit(tx, actorId, "QUOTE_CONVERTED", "Quote", id, { quote: quote.number, order: order.orderNumber });
  return order;
}
