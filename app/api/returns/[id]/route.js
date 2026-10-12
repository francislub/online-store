// app/api/returns/[id]/route.js
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { requireRole, ROLES, handleError } from "@/lib/apiAuth";
import { returnInclude, updateReturnTx, transitionReturnTx, deleteReturnsTx } from "@/lib/returnService";

export async function GET(request, { params }) {
  try {
    const { error } = await requireRole(ROLES.RETURNS);
    if (error) return error;
    const { id } = await params;

    const found = await db.return.findUnique({ where: { id }, include: returnInclude });
    if (!found) return NextResponse.json({ message: "Return not found" }, { status: 404 });
    return NextResponse.json(found);
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
      (tx) => (body.status ? transitionReturnTx(tx, id, body, user.id, user.role) : updateReturnTx(tx, id, body, user.id)),
      { timeout: 30000 }
    );
    return NextResponse.json({ data: updated, message: "Return updated successfully" });
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
