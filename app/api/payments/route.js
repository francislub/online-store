// app/api/payments/route.js
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { requireRole, ROLES, handleError, dateRange } from "@/lib/apiAuth";
import { PAYMENT_METHODS, PAYMENT_STATUSES } from "@/lib/constants";
import { paymentInclude, recordPaymentTx, deletePaymentsTx } from "@/lib/paymentService";

// GET /api/payments?search=&status=&method=&from=&to=&orderId=
export async function GET(request) {
  try {
    const { error } = await requireRole(ROLES.PAYMENTS);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();
    const status = searchParams.get("status");
    const method = searchParams.get("method");
    const orderId = searchParams.get("orderId");
    const range = dateRange(searchParams.get("from"), searchParams.get("to"));

    const where = {};
    if (status && PAYMENT_STATUSES.includes(status)) where.status = status;
    if (method && PAYMENT_METHODS.includes(method)) where.method = method;
    if (orderId) where.orderId = orderId;
    if (range) where.paidAt = range;
    if (search) {
      where.OR = [
        { reference: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
        { order: { is: { orderNumber: { contains: search, mode: "insensitive" } } } },
        { customer: { is: { name: { contains: search, mode: "insensitive" } } } },
      ];
    }

    const payments = await db.payment.findMany({
      where,
      orderBy: { paidAt: "desc" },
      take: 1000,
      include: paymentInclude,
    });
    return NextResponse.json(payments);
  } catch (error) {
    return handleError(error, "Failed to fetch payments");
  }
}

// POST /api/payments  body: { orderId?, customerId?, amount, method, status?, notes?, paidAt? }
export async function POST(request) {
  try {
    const { user, error } = await requireRole(ROLES.PAYMENTS);
    if (error) return error;

    const body = await request.json();
    const payment = await db.$transaction((tx) => recordPaymentTx(tx, body, user.id), { timeout: 30000 });
    return NextResponse.json({ data: payment, message: "Payment recorded successfully" }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

// DELETE /api/payments  body: { ids: [] }  (admin only)
export async function DELETE(request) {
  try {
    const { user, error } = await requireRole(ROLES.ADMIN_ONLY);
    if (error) return error;

    const { ids } = await request.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ message: "No payments selected" }, { status: 400 });
    }

    const count = await db.$transaction((tx) => deletePaymentsTx(tx, ids, user.id), { timeout: 30000 });
    return NextResponse.json({ message: `${count} payment(s) deleted` });
  } catch (error) {
    return handleError(error);
  }
}
