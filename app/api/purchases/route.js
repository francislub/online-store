// Route: /api/purchases
// File: src/app/api/purchases/route.js
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { buildItems, generateReference, receivePurchase } from "@/lib/purchases";

const STATUSES = ["DRAFT", "ORDERED", "RECEIVED", "CANCELLED"];

export async function GET(request) {
  try {
    const search = request.nextUrl.searchParams.get("search")?.trim();
    const status = request.nextUrl.searchParams.get("status");

    const where = {};
    if (status && STATUSES.includes(status)) where.status = status;
    if (search) {
      where.OR = [
        { reference: { contains: search, mode: "insensitive" } },
        { supplier: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const purchases = await db.purchase.findMany({
      where,
      include: { supplier: true, _count: { select: { items: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(purchases);
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Failed to fetch purchases" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    if (!data.supplierId) {
      return NextResponse.json({ message: "Select a supplier" }, { status: 400 });
    }
    const status = ["DRAFT", "ORDERED", "RECEIVED"].includes(data.status) ? data.status : "DRAFT";

    const built = buildItems(data.items);
    if (built.error) return NextResponse.json({ message: built.error }, { status: 400 });

    const tax = Number(data.tax) || 0;
    const reference = await generateReference("PO");

    const purchase = await db.$transaction(async (tx) => {
      const created = await tx.purchase.create({
        data: {
          reference,
          supplierId: data.supplierId,
          status: status === "RECEIVED" ? "ORDERED" : status,
          subtotal: built.subtotal,
          tax,
          total: built.subtotal + tax,
          notes: data.notes || null,
          purchasedAt: data.purchasedAt ? new Date(data.purchasedAt) : new Date(),
          items: { create: built.items },
        },
      });
      if (status === "RECEIVED") return receivePurchase(tx, created.id, data.userId);
      return created;
    });

    return NextResponse.json(purchase, { status: 201 });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: error.message || "Failed to create purchase" }, { status: 500 });
  }
}

// Bulk delete: { ids: [...] } (only DRAFT / CANCELLED purchases)
export async function DELETE(request) {
  try {
    const { ids } = await request.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ message: "No purchases selected" }, { status: 400 });
    }
    const locked = await db.purchase.count({
      where: { id: { in: ids }, status: { in: ["ORDERED", "RECEIVED"] } },
    });
    if (locked > 0) {
      return NextResponse.json(
        { message: "Only draft or cancelled purchases can be deleted" },
        { status: 409 }
      );
    }
    await db.purchaseItem.deleteMany({ where: { purchaseId: { in: ids } } });
    const result = await db.purchase.deleteMany({ where: { id: { in: ids } } });
    return NextResponse.json({ message: `${result.count} purchase(s) deleted` });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Failed to delete purchases" }, { status: 500 });
  }
}