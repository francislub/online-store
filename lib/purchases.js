// lib/purchases.js
// Route: n/a (server helpers shared by the purchase API routes)
import db from "@/lib/db";

export async function generateReference(prefix = "PO") {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const count = await db.purchase.count({
    where: { reference: { startsWith: `${prefix}-${stamp}` } },
  });
  return `${prefix}-${stamp}-${String(count + 1).padStart(4, "0")}`;
}

// Validates raw line items from the client and recomputes totals on the server
export function buildItems(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return { error: "Add at least one product to the purchase" };
  }
  const items = [];
  for (const item of rawItems) {
    const quantity = Number(item.quantity);
    const unitCost = Number(item.unitCost);
    if (!item.productId) return { error: "Every line needs a product" };
    if (!Number.isInteger(quantity) || quantity <= 0) return { error: "Quantity must be a whole number above 0" };
    if (!Number.isFinite(unitCost) || unitCost < 0) return { error: "Unit cost must be 0 or more" };
    items.push({ productId: item.productId, quantity, unitCost, total: quantity * unitCost });
  }
  const subtotal = items.reduce((sum, i) => sum + i.total, 0);
  return { items, subtotal };
}

// Moves stock in, logs StockMovements, raises supplier balance and marks the purchase RECEIVED.
// Must be called inside db.$transaction(async (tx) => ...)
export async function receivePurchase(tx, purchaseId, userId = null) {
  const purchase = await tx.purchase.findUnique({
    where: { id: purchaseId },
    include: { items: true },
  });
  if (!purchase) throw new Error("Purchase not found");
  if (purchase.status === "RECEIVED") throw new Error("Purchase already received");
  if (purchase.status === "CANCELLED") throw new Error("Cancelled purchases cannot be received");

  for (const item of purchase.items) {
    const product = await tx.product.update({
      where: { id: item.productId },
      data: { stock: { increment: item.quantity }, costPrice: item.unitCost },
    });
    await tx.stockMovement.create({
      data: {
        productId: item.productId,
        type: "PURCHASE",
        quantity: item.quantity,
        balanceAfter: product.stock,
        reference: purchase.reference,
        notes: "Stock received from supplier",
        createdById: userId || null,
      },
    });
  }

  await tx.supplier.update({
    where: { id: purchase.supplierId },
    data: { balance: { increment: purchase.total } },
  });

  return tx.purchase.update({ where: { id: purchaseId }, data: { status: "RECEIVED" } });
}