// app/api/returns/route.js
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { requireRole, ROLES, handleError, dateRange } from "@/lib/apiAuth";
import { RETURN_STATUSES } from "@/lib/constants";
import { returnInclude as serviceReturnInclude, createReturnTx, deleteReturnsTx } from "@/lib/returnService";
import { fixReturnInclude, withReturnInvoice } from "@/lib/invoiceLink";

// The service's include may still select `order.invoice`; the schema now has `invoices`, so patch it here.
const returnInclude = fixReturnInclude(serviceReturnInclude);

// GET /api/returns?search=&status=&from=&to=&orderId=
export async function GET(request) {
  try {
    const { error } = await requireRole(ROLES.RETURNS);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();
    const status = searchParams.get("status");
    const orderId = searchParams.get("orderId");
    const range = dateRange(searchParams.get("from"), searchParams.get("to"));

    const where = {};
    if (status && RETURN_STATUSES.includes(status)) where.status = status;
    if (orderId) where.orderId = orderId;
    if (range) where.createdAt = range;
    if (search) {
      where.OR = [
        { reference: { contains: search, mode: "insensitive" } },
        { reason: { contains: search, mode: "insensitive" } },
        { order: { is: { orderNumber: { contains: search, mode: "insensitive" } } } },
        { order: { is: { customer: { is: { name: { contains: search, mode: "insensitive" } } } } } },
      ];
    }

    const returns = await db.return.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 1000,
      include: returnInclude,
    });
    return NextResponse.json(returns.map(withReturnInvoice));
  } catch (error) {
    return handleError(error, "Failed to fetch returns");
  }
}

// POST /api/returns  body: { orderId, reason, notes?, refundAmount?, items: [{ productId, quantity }] }
export async function POST(request) {
  try {
    const { user, error } = await requireRole(ROLES.RETURNS);
    if (error) return error;

    const body = await request.json();
    const created = await db.$transaction((tx) => createReturnTx(tx, body, user.id), { timeout: 30000 });
    return NextResponse.json(
      { data: withReturnInvoice(created), message: "Return created successfully" },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}

// DELETE /api/returns  body: { ids: [] }  (admin only)
export async function DELETE(request) {
  try {
    const { user, error } = await requireRole(ROLES.ADMIN_ONLY);
    if (error) return error;

    const { ids } = await request.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ message: "No returns selected" }, { status: 400 });
    }

    const { deleted, skipped } = await db.$transaction((tx) => deleteReturnsTx(tx, ids, user.id), { timeout: 30000 });
    return NextResponse.json({
      message: `${deleted} return(s) deleted${skipped ? `, ${skipped} processed return(s) kept` : ""}`,
    });
  } catch (error) {
    return handleError(error);
  }
}