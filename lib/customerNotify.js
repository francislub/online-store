// lib/customerNotify.js
// Server-only customer notification helpers.
//
// Usage:
//   await notifyAccountCreated(user);
//   await notifyOrderPlaced(order.id);
//
// These helpers avoid duplicate notifications and never throw.
// sweepCustomerActivity() detects recent customer activity that was not
// already handled by the normal notification helpers.

import db from "@/lib/db";
import { EVENTS } from "@/lib/activityConfig";
import {
  recordActivity,
  checkStockLevel,
} from "@/lib/notify";
import {
  orderMessage,
  customerOrderMessage,
  accountMessage,
  welcomeMessage,
} from "@/lib/notifyMessages";

async function alreadyNotified(event, message) {
  try {
    const cfg = EVENTS[event];

    const hit = await db.notification.findFirst({
      where: {
        type: cfg.category,
        title: cfg.title,
        message,
      },
      select: {
        id: true,
      },
    });

    return Boolean(hit);
  } catch {
    // A notification lookup failure must not break the request.
    return false;
  }
}

/**
 * Accepts an order ID or an order object containing an ID.
 * Guest checkouts without a customer account are supported.
 */
export async function notifyOrderPlaced(order) {
  try {
    const id = typeof order === "string" ? order : order?.id;

    if (!id) return false;

    const full = await db.order.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          select: {
            productId: true,
            quantity: true,
          },
        },
      },
    });

    if (!full) return false;

    const message = orderMessage(full);

    if (await alreadyNotified("ORDER_CREATED", message)) {
      return false;
    }

    // Notify relevant staff members about the order.
    await recordActivity({
      event: "ORDER_CREATED",
      actorId: full.customerId ?? null,
      entity: "Order",
      entityId: full.id,
      message,
      metadata: {
        orderNumber: full.orderNumber,
        total: full.total,
        phone: full.phone,
      },
    });

    // Notify the customer when an account is associated with the order.
    if (full.customerId) {
      await recordActivity({
        event: "CUSTOMER_ORDER_PLACED",
        actorId: full.customerId,
        entity: "Order",
        entityId: full.id,
        message: customerOrderMessage(full),
        notifyUserIds: [full.customerId],
        skipActor: false,
      });
    }

    // Check stock after the order has been placed.
    for (const item of full.items) {
      await checkStockLevel(item.productId);
    }

    return true;
  } catch (error) {
    console.error("[notifyOrderPlaced] failed:", error);

    return false;
  }
}

/**
 * Accepts a user ID or a user object.
 * Only customer registrations trigger these notifications.
 */
export async function notifyAccountCreated(user) {
  try {
    const u =
      typeof user === "string" || !user?.name
        ? await db.user.findUnique({
            where: {
              id: typeof user === "string" ? user : user.id,
            },
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
            },
          })
        : user;

    if (!u) return false;

    // Staff accounts are not customer registrations.
    if (u.role && u.role !== "CUSTOMER") {
      return false;
    }

    const message = accountMessage(u);

    if (
      await alreadyNotified("CUSTOMER_REGISTERED", message)
    ) {
      return false;
    }

    // Notify staff about the new customer.
    await recordActivity({
      event: "CUSTOMER_REGISTERED",
      actorId: u.id,
      entity: "User",
      entityId: u.id,
      message,
    });

    // Send a welcome notification to the customer's account.
    await recordActivity({
      event: "CUSTOMER_WELCOME",
      actorId: u.id,
      entity: "User",
      entityId: u.id,
      message: welcomeMessage(u.name),
      notifyUserIds: [u.id],
      skipActor: false,
    });

    return true;
  } catch (error) {
    console.error("[notifyAccountCreated] failed:", error);

    return false;
  }
}

// ---------------------------------------------------------------------------
// Customer activity safety net.
//
// Called from the staff summary route.
// Processes recent orders and customer accounts that have not already
// been handled by the regular notification helpers.
// ---------------------------------------------------------------------------

const GRACE_MS = 20000;

let lastSweep = 0;

export async function sweepCustomerActivity() {
  const now = Date.now();

  // Prevent frequent overlapping sweeps within the same process.
  if (now - lastSweep < 3000) return;

  lastSweep = now;

  try {
    const cutoff = new Date(now - GRACE_MS);

    const row = await db.appSetting.findUnique({
      where: { key: "notifyCursor" },
    });

    if (!row) {
      // First run: establish a cursor without backfilling old records.
      await db.appSetting.upsert({
        where: { key: "notifyCursor" },
        update: {},
        create: {
          key: "notifyCursor",
          value: {
            orders: cutoff.toISOString(),
            users: cutoff.toISOString(),
          },
        },
      });

      return;
    }

    const cur = row.value ?? {};

    const sinceOrders = new Date(cur.orders ?? cutoff);
    const sinceUsers = new Date(cur.users ?? cutoff);

    const [orders, users] = await Promise.all([
      db.order.findMany({
        where: {
          createdAt: {
            gt: sinceOrders,
            lte: cutoff,
          },
        },
        orderBy: {
          createdAt: "asc",
        },
        take: 50,
        select: {
          id: true,
          createdAt: true,
        },
      }),

      db.user.findMany({
        where: {
          role: "CUSTOMER",
          createdAt: {
            gt: sinceUsers,
            lte: cutoff,
          },
        },
        orderBy: {
          createdAt: "asc",
        },
        take: 50,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
        },
      }),
    ]);

    if (orders.length === 0 && users.length === 0) {
      return;
    }

    for (const order of orders) {
      await notifyOrderPlaced(order.id);
    }

    for (const user of users) {
      await notifyAccountCreated(user);
    }

    await db.appSetting.update({
      where: { key: "notifyCursor" },
      data: {
        value: {
          orders: (
            orders.length
              ? orders[orders.length - 1].createdAt
              : sinceOrders
          ).toISOString(),

          users: (
            users.length
              ? users[users.length - 1].createdAt
              : sinceUsers
          ).toISOString(),
        },
      },
    });
  } catch (error) {
    console.error("[sweepCustomerActivity] failed:", error);
  }
}