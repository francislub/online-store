// src/lib/customerNotify.js
// Server-only. Raises notifications when a CUSTOMER creates an account or places an order.
//
//   await notifyAccountCreated(user);      // after the user row is created
//   await notifyOrderPlaced(order.id);     // after the order (and its items) are saved
//
// Both are safe to call twice (they skip if the same message already exists) and never throw.
// sweepCustomerActivity() is a safety net: it finds customer orders / accounts that were created
// without either call (any route, any script) and notifies for them.
import db from "@/lib/db";
import { EVENTS } from "@/lib/activityConfig";
import { recordActivity, checkStockLevel } from "@/lib/notify";
import { orderMessage, customerOrderMessage, accountMessage, welcomeMessage } from "@/lib/notifyMessages";

async function alreadyNotified(event, message) {
  try {
    const cfg = EVENTS[event];
    const hit = await db.notification.findFirst({
      where: { type: cfg.category, title: cfg.title, message },
      select: { id: true },
    });
    return !!hit;
  } catch (error) {
    return false;
  }
}

/** order = order id (string) or an object with an id. Guest checkouts (no customer) are supported. */
export async function notifyOrderPlaced(order) {
  try {
    const id = typeof order === "string" ? order : order?.id;
    if (!id) return false;

    const full = await db.order.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        items: { select: { productId: true, quantity: true } },
      },
    });
    if (!full) return false;

    const message = orderMessage(full);
    if (await alreadyNotified("ORDER_CREATED", message)) return false;

    // 1) staff (Admin, Sales, Cashier, Storekeeper): shows on the bell + the Orders sidebar button
    await recordActivity({
      event: "ORDER_CREATED",
      actorId: full.customerId ?? null,
      entity: "Order",
      entityId: full.id,
      message,
      metadata: { orderNumber: full.orderNumber, total: full.total, phone: full.phone },
    });

    // 2) the customer's own header bell (only when they are signed in / have an account)
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

    // 3) the sale may have pushed products to low / out of stock
    for (const item of full.items) await checkStockLevel(item.productId);

    return true;
  } catch (error) {
    console.log("[notifyOrderPlaced] failed", error);
    return false;
  }
}

/** user = user id (string) or the created user object ({ id, name, email, role }). */
export async function notifyAccountCreated(user) {
  try {
    const u =
      typeof user === "string" || !user?.name
        ? await db.user.findUnique({
            where: { id: typeof user === "string" ? user : user.id },
            select: { id: true, name: true, email: true, phone: true, role: true },
          })
        : user;
    if (!u) return false;
    if (u.role && u.role !== "CUSTOMER") return false; // staff accounts are not customer sign-ups

    const message = accountMessage(u);
    if (await alreadyNotified("CUSTOMER_REGISTERED", message)) return false;

    // 1) staff (Admin + Sales): Customers sidebar button + bell
    await recordActivity({
      event: "CUSTOMER_REGISTERED",
      actorId: u.id,
      entity: "User",
      entityId: u.id,
      message,
    });

    // 2) welcome message in the new customer's own header
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
    console.log("[notifyAccountCreated] failed", error);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Safety net. Called from the staff summary route (polled every 5s by every open dashboard).
// Looks only at orders / customers created AFTER the first run, and only once they are 20s old,
// so a route that calls the helpers above always wins and nothing is notified twice.
// ---------------------------------------------------------------------------
const GRACE_MS = 20000;
let lastSweep = 0;

export async function sweepCustomerActivity() {
  const now = Date.now();
  if (now - lastSweep < 3000) return;
  lastSweep = now;

  try {
    const cutoff = new Date(now - GRACE_MS);
    const row = await db.appSetting.findUnique({ where: { key: "notifyCursor" } });

    if (!row) {
      // first ever run: start from now, never back-fill old history
      await db.appSetting.upsert({
        where: { key: "notifyCursor" },
        update: {},
        create: { key: "notifyCursor", value: { orders: cutoff.toISOString(), users: cutoff.toISOString() } },
      });
      return;
    }

    const cur = row.value ?? {};
    const sinceOrders = new Date(cur.orders ?? cutoff);
    const sinceUsers = new Date(cur.users ?? cutoff);

    const [orders, users] = await Promise.all([
      db.order.findMany({
        where: { createdAt: { gt: sinceOrders, lte: cutoff } },
        orderBy: { createdAt: "asc" },
        take: 50,
        select: { id: true, createdAt: true },
      }),
      db.user.findMany({
        where: { role: "CUSTOMER", createdAt: { gt: sinceUsers, lte: cutoff } },
        orderBy: { createdAt: "asc" },
        take: 50,
        select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
      }),
    ]);
    if (orders.length === 0 && users.length === 0) return;

    for (const o of orders) await notifyOrderPlaced(o.id);
    for (const u of users) await notifyAccountCreated(u);

    await db.appSetting.update({
      where: { key: "notifyCursor" },
      data: {
        value: {
          orders: (orders.length ? orders[orders.length - 1].createdAt : sinceOrders).toISOString(),
          users: (users.length ? users[users.length - 1].createdAt : sinceUsers).toISOString(),
        },
      },
    });
  } catch (error) {
    console.log("[sweepCustomerActivity] failed", error);
  }
}