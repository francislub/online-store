// app/api/quotes/[id]/convert/route.js
// Converts a quote into an order (stock out + invoice) in one transaction
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { requireRole, ROLES, handleError } from "@/lib/apiAuth";
import { convertQuoteTx } from "@/lib/quoteService";

export async function POST(request, { params }) {
  try {
    const { user, error } = await requireRole(ROLES.QUOTES);
    if (error) return error;
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const order = await db.$transaction((tx) => convertQuoteTx(tx, id, body, user.id), { timeout: 30000 });
    return NextResponse.json({ data: order, message: "Quote converted to order" }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
