// Route: /api/purchases/[id]
// File: src/app/api/purchases/[id]/route.js
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { buildItems, receivePurchase } from "@/lib/purchases";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const purchase = await db.purchase.findUnique({
      where: { id },
      include: { supplier: true, items: { include: { product: true } } },
    });
    if (!purchase) return NextResponse.json({ message: "Purchase not found" }, { status: 404 });
    return NextResponse.json(purchase);
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Failed to fetch purchase" }, { status: 500 });
  }
}

// Edit a DRAFT / ORDERED purchase (replaces its lines)
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const data = await request.json();

    const existing = await db.purchase.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ message: "Purchase not found" }, { status: 404 });
    if (!["DRAFT", "ORDERED"].includes(existing.status)) {
      return NextResponse.json({ message: "Received or cancelled purchases cannot be edited" }, { status: 409 });
    }
    if (!data.supplierId) return NextResponse.json({ message: "Select a supplier" }, { status: 400 });

    const built = buildItems(data.items);
    if (built.error) return NextResponse.json({ message: built.error }, { status: 400 });

    const status = ["DRAFT", "ORDERED", "RECEIVED"].includes(data.status) ? data.status : existing.status;
    const tax = Number(data.tax) || 0;

    const purchase = await db.$transaction(async (tx) => {
      await tx.purchaseItem.deleteMany({ where: { purchaseId: id } });
      const updated = await tx.purchase.update({
        where: { id },
        data: {
          supplierId: data.supplierId,
          status: status === "RECEIVED" ? "ORDERED" : status,
          subtotal: built.subtotal,
          tax,
          total: built.subtotal + tax,
          notes: data.notes || null,
          purchasedAt: data.purchasedAt ? new Date(data.purchasedAt) : existing.purchasedAt,
          items: { create: built.items },
        },
      });
      if (status === "RECEIVED") return receivePurchase(tx, id, data.userId);
      return updated;
    });

    return NextResponse.json(purchase);
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: error.message || "Failed to update purchase" }, { status: 500 });
  }
}

// Status transitions: { status: "ORDERED" | "RECEIVED" | "CANCELLED" }
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const { status, userId } = await request.json();

    const existing = await db.purchase.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ message: "Purchase not found" }, { status: 404 });

    const allowed = {
      DRAFT: ["ORDERED", "RECEIVED", "CANCELLED"],
      ORDERED: ["RECEIVED", "CANCELLED"],
      RECEIVED: [],
      CANCELLED: [],
    };
    if (!allowed[existing.status]?.includes(status)) {
      return NextResponse.json(
        { message: `Cannot change a ${existing.status.toLowerCase()} purchase to ${String(status).toLowerCase()}` },
        { status: 409 }
      );
    }

    const purchase = await db.$transaction(async (tx) => {
      if (status === "RECEIVED") return receivePurchase(tx, id, userId);
      return tx.purchase.update({ where: { id }, data: { status } });
    });

    return NextResponse.json(purchase);
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: error.message || "Failed to update status" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const existing = await db.purchase.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ message: "Purchase not found" }, { status: 404 });
    if (["ORDERED", "RECEIVED"].includes(existing.status)) {
      return NextResponse.json({ message: "Only draft or cancelled purchases can be deleted" }, { status: 409 });
    }
    await db.purchaseItem.deleteMany({ where: { purchaseId: id } });
    await db.purchase.delete({ where: { id } });
    return NextResponse.json({ message: "Purchase deleted" });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Failed to delete purchase" }, { status: 500 });
  }
}