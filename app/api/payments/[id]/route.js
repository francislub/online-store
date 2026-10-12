// app/api/payments/[id]/route.js
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { requireRole, ROLES, handleError } from "@/lib/apiAuth";
import { paymentInclude, updatePaymentTx, deletePaymentsTx } from "@/lib/paymentService";

export async function GET(request, { params }) {
  try {
    const { error } = await requireRole(ROLES.PAYMENTS);
    if (error) return error;
    const { id } = await params;

    const payment = await db.payment.findUnique({
      where: { id },
      include: {
        ...paymentInclude,
        order: { select: { id: true, orderNumber: true, total: true, status: true, invoice: { select: { id: true, number: true, balance: true } } } },
      },
    });
    if (!payment) return NextResponse.json({ message: "Payment not found" }, { status: 404 });
    return NextResponse.json(payment);
  } catch (error) {
    return handleError(error, "Failed to fetch payment");
  }
}

// PUT /api/payments/:id  body: { amount?, method?, status?, notes?, paidAt? }  (the order can't be changed)
export async function PUT(request, { params }) {
  try {
    const { user, error } = await requireRole(ROLES.PAYMENTS);
    if (error) return error;
    const { id } = await params;
    const body = await request.json();

    const payment = await db.$transaction((tx) => updatePaymentTx(tx, id, body, user.id), { timeout: 30000 });
    return NextResponse.json({ data: payment, message: "Payment updated successfully" });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user, error } = await requireRole(ROLES.ADMIN_ONLY);
    if (error) return error;
    const { id } = await params;

    await db.$transaction((tx) => deletePaymentsTx(tx, [id], user.id), { timeout: 30000 });
    return NextResponse.json({ message: "Payment deleted" });
  } catch (error) {
    return handleError(error);
  }
}
