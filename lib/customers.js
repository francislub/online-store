// lib/customers.js
// Route: n/a (shared server helpers for the customers module)
import db from "@/lib/db";

// Never expose passwordHash
export const customerSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  isActive: true,
  avatarUrl: true,
  emailVerified: true,
  createdAt: true,
  updatedAt: true,
};

// User.email is required + unique, so walk-in customers without an email get a placeholder.
const PLACEHOLDER_DOMAIN = "walkin.local";
export const makePlaceholderEmail = () =>
  `walkin-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@${PLACEHOLDER_DOMAIN}`;
export const isPlaceholderEmail = (email) => !!email && email.endsWith(`@${PLACEHOLDER_DOMAIN}`);

// Order count, total spent, outstanding invoice balance and last order date for many customers at once
export async function loadCustomerStats(ids) {
  const stats = {};
  ids.forEach((id) => {
    stats[id] = { orderCount: 0, totalSpent: 0, outstanding: 0, lastOrderAt: null };
  });
  if (ids.length === 0) return stats;

  const orderGroups = await db.order.groupBy({
    by: ["customerId"],
    where: { customerId: { in: ids }, status: { not: "CANCELLED" } },
    _count: { _all: true },
    _sum: { total: true },
    _max: { createdAt: true },
  });
  orderGroups.forEach((g) => {
    if (!stats[g.customerId]) return;
    stats[g.customerId].orderCount = g._count._all;
    stats[g.customerId].totalSpent = g._sum.total ?? 0;
    stats[g.customerId].lastOrderAt = g._max.createdAt;
  });

  const invoices = await db.invoice.findMany({
    where: { order: { customerId: { in: ids } }, status: { in: ["ISSUED", "SENT", "OVERDUE"] } },
    select: { balance: true, order: { select: { customerId: true } } },
  });
  invoices.forEach((inv) => {
    const id = inv.order?.customerId;
    if (id && stats[id]) stats[id].outstanding += inv.balance;
  });

  return stats;
}

// Deletes a customer only when there is no business history attached to them.
// Returns { ok: true } or { ok: false, reason }
export async function deleteCustomerIfUnused(id) {
  const customer = await db.user.findFirst({ where: { id, role: "CUSTOMER" }, select: { id: true } });
  if (!customer) return { ok: false, reason: "Customer not found" };

  const [orders, payments, quotes] = await Promise.all([
    db.order.count({ where: { customerId: id } }),
    db.payment.count({ where: { customerId: id } }),
    db.quote.count({ where: { customerId: id } }),
  ]);

  if (orders || payments || quotes) {
    const parts = [];
    if (orders) parts.push(`${orders} order(s)`);
    if (payments) parts.push(`${payments} payment(s)`);
    if (quotes) parts.push(`${quotes} quote(s)`);
    return { ok: false, reason: `Has ${parts.join(", ")} - deactivate instead of deleting` };
  }

  await db.address.deleteMany({ where: { userId: id } });
  await db.notification.deleteMany({ where: { userId: id } });
  await db.adminSession.deleteMany({ where: { userId: id } });
  await db.user.delete({ where: { id } });
  return { ok: true };
}