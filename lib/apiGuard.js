// lib/apiGuard.js
// Route: n/a (shared server helper: role checks + small response helpers for API routes)
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const ADMIN_ONLY = ["ADMIN"];
export const ADMIN_CASH_SALES = ["ADMIN", "CASHIER", "SALES"];

export const isObjectId = (value) => typeof value === "string" && /^[a-f\d]{24}$/i.test(value);

export const fail = (message, status = 400) => NextResponse.json({ data: null, message }, { status });

// Usage: const { error, session } = await requireRoles(ADMIN_CASH_SALES); if (error) return error;
export async function requireRoles(roles = ADMIN_CASH_SALES) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: NextResponse.json({ data: null, message: "Unauthorized" }, { status: 401 }) };
  if (!roles.includes(session.user.role)) {
    return { error: NextResponse.json({ data: null, message: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}