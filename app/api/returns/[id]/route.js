// app/api/returns/[id]/route.js
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { requireRole, ROLES, handleError } from "@/lib/apiAuth";
import {
  returnInclude as serviceReturnInclude,
  updateReturnTx,
  transitionReturnTx,
  deleteReturnsTx,
} from "@/lib/returnService";
import { fixReturnInclude, withReturnInvoice } from "@/lib/invoiceLink";

// The service's include may still select `order.invoice`; the schema now has `invoices`, so patch it here.
const returnInclude = fixReturnInclude(serviceReturnInclude);

export async function GET(request, { params }) {
  try {
    const { error } = await requireRole(ROLES.RETURNS);
    if (error) return error;
    const { id } = await params;

    const found = await db.return.findUnique({ where: { id }, include: returnInclude });
    if (!found) return NextResponse.json({ message: "Return not found" }, { status: 404 });
    return NextResponse.json(withReturnInvoice(found));
  } catch (error) {
    return handleError(error, "Failed to fetch return");
  }
}

// PUT /api/returns/:id
//  - workflow step:  { status, condition? ("RESTOCK" | "DAMAGED"), method?, notes? }
//  - edit details:   { reason?, notes?, refundAmount?, items? }
export async function PUT(request, { params }) {
  try {
    const { user, error } = await requireRole(ROLES.RETURNS);
    if (error) return error;
    const { id } = await params;
    const body = await request.json();

    const updated = await db.$transaction(
      (tx) =>
        body.status ? transitionReturnTx(tx, id, body, user.id, user.role) : updateReturnTx(tx, id, body, user.id),
      { timeout: 30000 }
    );
    return NextResponse.json({ data: withReturnInvoice(updated), message: "Return updated successfully" });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user, error } = await requireRole(ROLES.ADMIN_ONLY);
    if (error) return error;
    const { id } = await params;

    await db.$transaction((tx) => deleteReturnsTx(tx, [id], user.id), { timeout: 30000 });
    return NextResponse.json({ message: "Return deleted" });
  } catch (error) {
    return handleError(error);
  }
}