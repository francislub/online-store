// lib/reports.js
// Route: n/a (server-side report builder, everything is read from the database)
import db from "@/lib/db";
import { dayKey, endOfDay, monthKey, startOfDay } from "@/lib/dates";

const sum = (list, pick) => list.reduce((total, item) => total + (pick(item) || 0), 0);
const pct = (part, whole) => (whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0);

export async function buildReport(from, to) {
  const gte = startOfDay(from);
  const lte = endOfDay(to);
  const now = new Date();

  const [orders, payments, expenses, purchases, refunds, openInvoices, suppliers, products] = await Promise.all([
    db.order.findMany({
      where: { createdAt: { gte, lte }, status: { not: "CANCELLED" } },
      select: {
        total: true,
        discount: true,
        tax: true,
        createdAt: true,
        items: {
          select: {
            productId: true,
            quantity: true,
            total: true,
            costPrice: true,
            product: { select: { name: true, sku: true } },
          },
        },
      },
    }),
    db.payment.findMany({
      where: { paidAt: { gte, lte }, status: { in: ["PAID", "PARTIAL"] } },
      select: { amount: true, method: true },
    }),
    db.expense.findMany({
      where: { spentAt: { gte, lte } },
      select: { amount: true, category: true, spentAt: true },
    }),
    db.purchase.findMany({
      where: { status: "RECEIVED", purchasedAt: { gte, lte } },
      select: { total: true },
    }),
    db.return.findMany({
      where: { status: "REFUNDED", updatedAt: { gte, lte } },
      select: { refundAmount: true },
    }),
    db.invoice.findMany({
      where: { status: { in: ["ISSUED", "SENT"] }, balance: { gt: 0 } },
      select: { number: true, customerName: true, balance: true, dueAt: true },
      orderBy: { balance: "desc" },
    }),
    db.supplier.findMany({
      where: { balance: { gt: 0 } },
      select: { name: true, balance: true },
      orderBy: { balance: "desc" },
    }),
    db.product.findMany({
      where: { isActive: true },
      select: { name: true, sku: true, stock: true, reorderLevel: true, costPrice: true, price: true },
    }),
  ]);

  // ── Profit & loss ──
  const revenue = sum(orders, (o) => o.total);
  const refundTotal = sum(refunds, (r) => r.refundAmount);
  const netSales = revenue - refundTotal;
  const cogs = sum(orders, (o) => sum(o.items, (i) => i.quantity * i.costPrice));
  const grossProfit = netSales - cogs;
  const expenseTotal = sum(expenses, (e) => e.amount);
  const netProfit = grossProfit - expenseTotal;

  // ── Sales / expenses over time (daily, or monthly for long ranges) ──
  const days = Math.round((lte - gte) / 86400000);
  const monthly = days > 62;
  const keyOf = (d) => (monthly ? monthKey(d) : dayKey(d));
  const series = new Map();
  const bucket = (key) => {
    if (!series.has(key)) series.set(key, { key, sales: 0, expenses: 0, orders: 0 });
    return series.get(key);
  };
  if (!monthly) {
    for (let t = gte.getTime(); t <= lte.getTime(); t += 86400000) bucket(dayKey(new Date(t)));
  }
  orders.forEach((o) => {
    const b = bucket(keyOf(o.createdAt));
    b.sales += o.total;
    b.orders += 1;
  });
  expenses.forEach((e) => {
    bucket(keyOf(e.spentAt)).expenses += e.amount;
  });
  const timeline = [...series.values()].sort((a, b) => a.key.localeCompare(b.key));

  // ── Top products ──
  const productMap = new Map();
  orders.forEach((o) =>
    o.items.forEach((i) => {
      const row = productMap.get(i.productId) ?? {
        name: i.product?.name ?? "Deleted product",
        sku: i.product?.sku ?? "-",
        quantity: 0,
        revenue: 0,
        profit: 0,
      };
      row.quantity += i.quantity;
      row.revenue += i.total;
      row.profit += i.total - i.quantity * i.costPrice;
      productMap.set(i.productId, row);
    })
  );
  const topProducts = [...productMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  // ── Expenses by category / payments by method ──
  const byCategory = {};
  expenses.forEach((e) => (byCategory[e.category] = (byCategory[e.category] || 0) + e.amount));
  const expenseByCategory = Object.entries(byCategory)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  const byMethod = {};
  payments.forEach((p) => (byMethod[p.method] = (byMethod[p.method] || 0) + p.amount));
  const paymentsByMethod = Object.entries(byMethod)
    .map(([method, amount]) => ({ method, amount }))
    .sort((a, b) => b.amount - a.amount);

  // ── Receivables (customers owe us) and payables (we owe suppliers) ──
  const overdue = openInvoices.filter((i) => i.dueAt && new Date(i.dueAt) < now);
  const stockedProducts = products.filter((p) => p.stock > 0);
  const lowStock = products
    .filter((p) => p.stock <= p.reorderLevel)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 15)
    .map((p) => ({ name: p.name, sku: p.sku, stock: p.stock, reorderLevel: p.reorderLevel }));

  return {
    range: { from, to, groupBy: monthly ? "month" : "day" },
    summary: {
      revenue,
      refunds: refundTotal,
      netSales,
      cogs,
      grossProfit,
      grossMargin: pct(grossProfit, netSales),
      expenses: expenseTotal,
      netProfit,
      netMargin: pct(netProfit, netSales),
      orderCount: orders.length,
      avgOrderValue: orders.length ? Math.round(revenue / orders.length) : 0,
      discounts: sum(orders, (o) => o.discount),
      tax: sum(orders, (o) => o.tax),
      cashCollected: sum(payments, (p) => p.amount),
      purchasesReceived: sum(purchases, (p) => p.total),
      purchaseCount: purchases.length,
    },
    timeline,
    topProducts,
    expenseByCategory,
    paymentsByMethod,
    receivables: {
      total: sum(openInvoices, (i) => i.balance),
      count: openInvoices.length,
      overdueTotal: sum(overdue, (i) => i.balance),
      overdueCount: overdue.length,
      top: openInvoices.slice(0, 8),
    },
    payables: {
      total: sum(suppliers, (s) => s.balance),
      count: suppliers.length,
      top: suppliers.slice(0, 8),
    },
    stock: {
      productCount: products.length,
      units: sum(products, (p) => p.stock),
      costValue: sum(stockedProducts, (p) => p.stock * p.costPrice),
      retailValue: sum(stockedProducts, (p) => p.stock * p.price),
      outOfStock: products.filter((p) => p.stock <= 0).length,
      lowStock,
    },
  };
}