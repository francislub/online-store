// lib/notify.js
// Server-only notification helper.
//
// Writes audit logs and distributes notifications.
// Notification failures do not break the API request.

import db from "@/lib/db";
import { EVENTS } from "@/lib/activityConfig";

async function disabledCategories() {
  try {
    const row = await db.appSetting.findUnique({
      where: { key: "notifications" },
    });

    return row?.value?.disabled ?? [];
  } catch {
    // If notification settings cannot be loaded, use default behavior.
    return [];
  }
}

/**
 * Records an activity and distributes notifications.
 *
 * @param {object} p
 * @param {string} p.event - Key from EVENTS.
 * @param {string|null} [p.actorId] - User who performed the action.
 * @param {string} [p.entity] - Entity name, such as Order or Product.
 * @param {string|null} [p.entityId] - Related entity ID.
 * @param {string} [p.message] - Notification message.
 * @param {object} [p.metadata] - Additional audit metadata.
 * @param {string[]} [p.notifyUserIds] - Additional users to notify.
 * @param {boolean} [p.skipActor=true] - Whether to exclude the actor.
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
      console.log("[recordActivity] unknown event:", event);
      return;
    }

    // Write the audit log when an actor is available.
    if (actorId) {
      await db.auditLog.create({
        data: {
          actorId,
          action: event,
          entity: entity ?? cfg.category,
          entityId: entityId ? String(entityId) : null,
          metadata: {
            message: message ?? cfg.title,
            ...(metadata ?? {}),
          },
        },
      });
    }

    const disabled = await disabledCategories();

    if (disabled.includes(cfg.category)) {
      return;
    }

    // Find active staff members assigned to this event.
    const staff = cfg.roles?.length
      ? await db.user.findMany({
          where: {
            isActive: true,
            role: {
              in: cfg.roles,
            },
          },
          select: {
            id: true,
          },
        })
      : [];

    // Combine staff and explicitly targeted users without duplicates.
    const ids = new Set([
      ...staff.map((user) => user.id),
      ...notifyUserIds.filter(Boolean).map(String),
    ]);

    if (skipActor && actorId) {
      ids.delete(String(actorId));
    }

    if (ids.size === 0) {
      return;
    }

    await db.notification.createMany({
      data: [...ids].map((userId) => ({
        userId,
        title: cfg.title,
        message: message ?? cfg.title,
        type: cfg.category,
      })),
    });
  } catch (error) {
    console.error("[recordActivity] failed:", error);
  }
}

// ---------------------------------------------------------------------------
// STOCK ALERTS
// Call after a product's stock quantity changes.
// ---------------------------------------------------------------------------

export async function checkStockLevel(productId, actorId = null) {
  try {
    const product = await db.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        reorderLevel: true,
      },
    });

    if (!product) return;

    if (product.stock <= 0) {
      await recordActivity({
        event: "OUT_OF_STOCK",
        actorId,
        entity: "Product",
        entityId: product.id,
        message: `${product.name} (${product.sku}) is out of stock`,
        skipActor: false,
      });
    } else if (product.stock <= product.reorderLevel) {
      await recordActivity({
        event: "LOW_STOCK",
        actorId,
        entity: "Product",
        entityId: product.id,
        message: `${product.name} (${product.sku}) is low: ${product.stock} left (reorder level ${product.reorderLevel})`,
        skipActor: false,
      });
    }
  } catch (error) {
    console.error("[checkStockLevel] failed:", error);
  }
}

// ---------------------------------------------------------------------------
// OVERDUE INVOICE NOTIFICATIONS
// Marks overdue invoices and notifies relevant users.
// The sweep is throttled to avoid running on every request.
// ---------------------------------------------------------------------------

let lastSweep = 0;

export async function sweepOverdueInvoices() {
  const now = Date.now();

  if (now - lastSweep < 10 * 60 * 1000) {
    return;
  }

  lastSweep = now;

  try {
    const overdue = await db.invoice.findMany({
      where: {
        status: {
          in: ["ISSUED", "SENT"],
        },
        dueAt: {
          lt: new Date(),
        },
        balance: {
          gt: 0,
        },
      },
      select: {
        id: true,
        number: true,
        customerName: true,
        balance: true,
      },
    });

    if (overdue.length === 0) {
      return;
    }

    await db.invoice.updateMany({
      where: {
        id: {
          in: overdue.map((invoice) => invoice.id),
        },
      },
      data: {
        status: "OVERDUE",
      },
    });

    for (const invoice of overdue) {
      await recordActivity({
        event: "INVOICE_OVERDUE",
        entity: "Invoice",
        entityId: invoice.id,
        message: `Invoice ${invoice.number}${
          invoice.customerName
            ? ` (${invoice.customerName})`
            : ""
        } is overdue, balance UGX ${Number(
          invoice.balance
        ).toLocaleString()}`,
      });
    }
  } catch (error) {
    console.error("[sweepOverdueInvoices] failed:", error);
  }
}