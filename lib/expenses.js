// lib/expenses.js
// Route: n/a (shared server helpers for expenses)
import db from "@/lib/db";

export const CATEGORIES = ["RENT", "TRANSPORT", "SALARIES", "UTILITIES", "REPAIRS", "MARKETING", "SUPPLIES", "OTHER"];

// TODO: replace the fallback with the logged-in user from your session.
export async function resolveRecordedById(data) {
  if (data?.recordedById) return data.recordedById;
  const user = await db.user.findFirst({
    where: { isActive: true, role: { in: ["ADMIN", "CASHIER"] } },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  return user?.id ?? null;
}

// Validates the body and returns { error } or { value }
export function parseExpense(data) {
  const title = String(data.title ?? "").trim();
  if (!title) return { error: "Enter a title" };
  if (!CATEGORIES.includes(data.category)) return { error: "Select a valid category" };
  const amount = Math.round(Number(data.amount));
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Amount must be greater than zero" };
  return {
    value: {
      title,
      category: data.category,
      amount,
      description: data.description?.trim() || null,
    },
  };
}