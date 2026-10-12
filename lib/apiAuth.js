// lib/apiAuth.js
// Route: n/a (shared helpers for API routes: role guard, errors, date filters, audit log)
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

// Who can use each module (matches the sidebar roles)
export const ROLES = {
  ORDERS: ["ADMIN", "CASHIER", "SALES", "STOREKEEPER"],
  CANCEL_ORDER: ["ADMIN", "SALES"],
  QUOTES: ["ADMIN", "SALES"],
  PAYMENTS: ["ADMIN", "CASHIER"],
  ADMIN_ONLY: ["ADMIN"],
  RETURNS: ["ADMIN", "CASHIER", "SALES", "STOREKEEPER"],
  // who may move a return INTO each status
  RETURN_STEPS: {
    APPROVED: ["ADMIN", "SALES"],
    REJECTED: ["ADMIN", "SALES"],
    RECEIVED: ["ADMIN", "STOREKEEPER"],
    REFUNDED: ["ADMIN", "CASHIER"],
    REPLACED: ["ADMIN", "SALES", "STOREKEEPER"],
  },
};

// Errors we throw on purpose (shown to the user as a toast)
export class ServiceError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function requireRole(allowed) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
  }
  if (allowed && !allowed.includes(session.user.role)) {
    return { error: NextResponse.json({ message: "Forbidden" }, { status: 403 }) };
  }
  return { session, user: session.user };
}

export function handleError(error, fallback = "Server error: something went wrong") {
  if (error instanceof ServiceError) {
    return NextResponse.json({ data: null, message: error.message }, { status: error.status });
  }
  console.log(error);
  return NextResponse.json({ data: null, message: fallback }, { status: 500 });
}

// ?from=2026-10-01&to=2026-10-12 -> Prisma date filter (inclusive of the whole "to" day)
export function dateRange(from, to) {
  const range = {};
  if (from) range.gte = new Date(`${from}T00:00:00.000`);
  if (to) range.lte = new Date(`${to}T23:59:59.999`);
  return Object.keys(range).length ? range : undefined;
}

export const toInt = (value, fallback = 0) => {
  const n = Math.round(Number(value));
  return Number.isFinite(n) ? n : fallback;
};

export async function audit(client, actorId, action, entity, entityId, metadata = null) {
  await client.auditLog.create({
    data: { actorId, action, entity, entityId: entityId ?? null, metadata },
  });
}