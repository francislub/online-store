// app/api/quotes/[id]/route.js
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { requireRole, ROLES, handleError, ServiceError, audit } from "@/lib/apiAuth";
import { QUOTE_STATUSES } from "@/lib/constants";
import { buildQuoteLines, quoteTotals } from "@/lib/quoteService";

const include = {
  customer: { select: { id: true, name: true, email: true, phone: true } },
  createdBy: { select: { id: true, name: true } },
};

export async function GET(request, { params }) {
  try {
    const { error } = await requireRole(ROLES.QUOTES);
    if (error) return error;
    const { id } = await params;

    const quote = await db.quote.findUnique({ where: { id }, include });
    if (!quote) return NextResponse.json({ message: "Quote not found" }, { status: 404 });
    return NextResponse.json(quote);
  } catch (error) {
    return handleError(error, "Failed to fetch quote");
  }
}

export async function PUT(request, { params }) {
  try {
    const { user, error } = await requireRole(ROLES.QUOTES);
    if (error) return error;
    const { id } = await params;
    const body = await request.json();

    const existing = await db.quote.findUnique({ where: { id } });
    if (!existing) throw new ServiceError("Quote not found", 404);
    if (existing.status === "CONVERTED") throw new ServiceError("Converted quotes can't be edited", 409);

    const data = {};
    if (body.status !== undefined && body.status !== existing.status) {
      if (!QUOTE_STATUSES.includes(body.status) || body.status === "CONVERTED") {
        throw new ServiceError("Invalid status (use Convert to turn a quote into an order)");
      }
      data.status = body.status;
    }
    if (body.customerId !== undefined) data.customerId = body.customerId || null;
    if (body.notes !== undefined) data.notes = body.notes?.trim() || null;
    if (body.validUntil !== undefined) {
      data.validUntil = body.validUntil ? new Date(`${body.validUntil}T23:59:59.999`) : null;
    }

    // Re-price when items, tax or discount change
    let subtotal = existing.subtotal;
    if (body.items) {
      const built = await buildQuoteLines(db, body.items);
      data.items = built.lines;
      subtotal = built.subtotal;
    }
    if (body.items || body.tax !== undefined || body.discount !== undefined) {
      const totals = quoteTotals(subtotal, body.tax ?? existing.tax, body.discount ?? existing.discount);
      Object.assign(data, { subtotal, ...totals });
    }

    const quote = await db.quote.update({ where: { id }, data, include });
    await audit(db, user.id, "QUOTE_UPDATED", "Quote", id, { number: quote.number, changes: Object.keys(data) });

    return NextResponse.json({ data: quote, message: "Quote updated successfully" });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user, error } = await requireRole(ROLES.QUOTES);
    if (error) return error;
    const { id } = await params;

    const existing = await db.quote.findUnique({ where: { id } });
    if (!existing) throw new ServiceError("Quote not found", 404);
    if (existing.status === "CONVERTED") throw new ServiceError("Converted quotes can't be deleted", 409);

    await db.quote.delete({ where: { id } });
    await audit(db, user.id, "QUOTE_DELETED", "Quote", id, { number: existing.number });
    return NextResponse.json({ message: "Quote deleted" });
  } catch (error) {
    return handleError(error);
  }
}
