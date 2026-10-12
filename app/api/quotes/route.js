// app/api/quotes/route.js
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { requireRole, ROLES, handleError, dateRange, audit } from "@/lib/apiAuth";
import { QUOTE_STATUSES } from "@/lib/constants";
import { makeNumber } from "@/lib/numbering";
import { buildQuoteLines, quoteTotals } from "@/lib/quoteService";

// GET /api/quotes?search=&status=&from=&to=
export async function GET(request) {
  try {
    const { error } = await requireRole(ROLES.QUOTES);
    if (error) return error;

    // Quotes past their validity date expire automatically (unless already accepted/converted)
    await db.quote.updateMany({
      where: { status: { in: ["DRAFT", "SENT"] }, validUntil: { lt: new Date() } },
      data: { status: "EXPIRED" },
    });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();
    const status = searchParams.get("status");
    const range = dateRange(searchParams.get("from"), searchParams.get("to"));

    const where = {};
    if (status && QUOTE_STATUSES.includes(status)) where.status = status;
    if (range) where.createdAt = range;
    if (search) {
      where.OR = [
        { number: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
        { customer: { is: { name: { contains: search, mode: "insensitive" } } } },
      ];
    }

    const quotes = await db.quote.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 1000,
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(quotes);
  } catch (error) {
    return handleError(error, "Failed to fetch quotes");
  }
}

export async function POST(request) {
  try {
    const { user, error } = await requireRole(ROLES.QUOTES);
    if (error) return error;

    const body = await request.json();
    const { lines, subtotal } = await buildQuoteLines(db, body.items);
    const totals = quoteTotals(subtotal, body.tax, body.discount);
    const status = ["DRAFT", "SENT"].includes(body.status) ? body.status : "DRAFT";

    const quote = await db.quote.create({
      data: {
        number: makeNumber("QT"),
        customerId: body.customerId || null,
        status,
        subtotal,
        ...totals,
        validUntil: body.validUntil ? new Date(`${body.validUntil}T23:59:59.999`) : null,
        notes: body.notes?.trim() || null,
        items: lines,
        createdById: user.id,
      },
    });
    await audit(db, user.id, "QUOTE_CREATED", "Quote", quote.id, { number: quote.number, total: quote.total });

    return NextResponse.json({ data: quote, message: "Quote created successfully" }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

// DELETE /api/quotes  body: { ids: [] }  (converted quotes are kept for the paper trail)
export async function DELETE(request) {
  try {
    const { user, error } = await requireRole(ROLES.QUOTES);
    if (error) return error;

    const { ids } = await request.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ message: "No quotes selected" }, { status: 400 });
    }

    const result = await db.quote.deleteMany({ where: { id: { in: ids }, status: { not: "CONVERTED" } } });
    if (result.count === 0) return NextResponse.json({ message: "Converted quotes can't be deleted" }, { status: 409 });
    await audit(db, user.id, "QUOTE_DELETED", "Quote", null, { count: result.count });

    const skipped = ids.length - result.count;
    return NextResponse.json({ message: `${result.count} quote(s) deleted${skipped ? `, ${skipped} converted quote(s) kept` : ""}` });
  } catch (error) {
    return handleError(error);
  }
}
