// lib/notify.js
// Route: n/a (server-only helper: writes the audit log AND fans out notifications)
// Call recordActivity() from any API route after a successful action.
// It never throws, so it can never break the request that called it.
import db from "@/lib/db";
import { EVENTS } from "@/lib/activityConfig";

async function disabledCategories() {
  try {
    const row = await db.appSetting.findUnique({ where: { key: "notifications" } });
    return row?.value?.disabled ?? [];
  } catch (error) {
    return [];
  }
}

/**
 * @param {object}   p
 * @param {string}   p.event            key of EVENTS (e.g. "ORDER_CREATED")
 * @param {string}   [p.actorId]        user who did it (audit log is skipped when missing, e.g. guest checkout)
 * @param {string}   [p.entity]         model name, e.g. "Order"
 * @param {string}   [p.entityId]
 * @param {string}   [p.message]        text shown in the notification
 * @param {object}   [p.metadata]       extra JSON stored in the audit log
 * @param {string[]} [p.notifyUserIds]  extra users to notify (e.g. the customer)
 * @param {boolean}  [p.skipActor=true] do not notify the person who did the action
 */
export async function recordActivity({
  event,
  actorId = null,
  entity,
  entityId = null,
  message,
  metadata,
  notifyUserIds = [],
  skipActor = true,
}) {
  try {
    const cfg = EVENTS[event];
    if (!cfg) {
      console.log("[recordActivity] unknown event", event);
      return;
    }

    if (actorId) {
      await db.auditLog.create({
        data: {
          actorId,
          action: event,
          entity: entity ?? cfg.category,
          entityId: entityId ? String(entityId) : null,
          metadata: { message: message ?? cfg.title, ...(metadata ?? {}) },
        },
      });
    }

    const disabled = await disabledCategories();
    if (disabled.includes(cfg.category)) return;

    const staff = cfg.roles?.length
      ? await db.user.findMany({
          where: { isActive: true, role: { in: cfg.roles } },
          select: { id: true },
        })
      : [];

    const ids = new Set([...staff.map((u) => u.id), ...notifyUserIds.filter(Boolean).map(String)]);
    if (skipActor && actorId) ids.delete(String(actorId));
    if (ids.size === 0) return;

    await db.notification.createMany({
      data: [...ids].map((userId) => ({
        userId,
        title: cfg.title,
        message: message ?? cfg.title,
        type: cfg.category,
      })),
    });
  } catch (error) {
    console.log("[recordActivity] failed", error);
  }
}

// Call after any stock change: raises LOW_STOCK / OUT_OF_STOCK alerts from the real product row.
export async function checkStockLevel(productId, actorId = null) {
  try {
    const p = await db.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, sku: true, stock: true, reorderLevel: true },
    });
    if (!p) return;
    if (p.stock <= 0) {
      await recordActivity({
        event: "OUT_OF_STOCK",
        actorId,
        entity: "Product",
        entityId: p.id,
        message: `${p.name} (${p.sku}) is out of stock`,
        skipActor: false,
      });
    } else if (p.stock <= p.reorderLevel) {
      await recordActivity({
        event: "LOW_STOCK",
        actorId,
        entity: "Product",
        entityId: p.id,
        message: `${p.name} (${p.sku}) is low: ${p.stock} left (reorder level ${p.reorderLevel})`,
        skipActor: false,
      });
    }
  } catch (error) {
    console.log("[checkStockLevel] failed", error);
  }
}

// Marks unpaid invoices past their due date as OVERDUE and notifies once per invoice.
// Throttled so it is cheap to call from a frequently hit route.
let lastSweep = 0;
export async function sweepOverdueInvoices() {
  const now = Date.now();
  if (now - lastSweep < 10 * 60 * 1000) return;
  lastSweep = now;
  try {
    const overdue = await db.invoice.findMany({
      where: {
        status: { in: ["ISSUED", "SENT"] },
        dueAt: { lt: new Date() },
        balance: { gt: 0 },
      },
      select: { id: true, number: true, customerName: true, balance: true },
    });
    if (overdue.length === 0) return;

    await db.invoice.updateMany({
      where: { id: { in: overdue.map((i) => i.id) } },
      data: { status: "OVERDUE" },
    });

    for (const inv of overdue) {
      await recordActivity({
        event: "INVOICE_OVERDUE",
        entity: "Invoice",
        entityId: inv.id,
        message: `Invoice ${inv.number}${inv.customerName ? ` (${inv.customerName})` : ""} is overdue, balance UGX ${Number(inv.balance).toLocaleString()}`,
      });
    }
  } catch (error) {
    console.log("[sweepOverdueInvoices] failed", error);
  }
}