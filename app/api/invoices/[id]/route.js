// Route: /api/invoices/[id]
// File: src/app/api/invoices/[id]/route.js
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { INVOICE_INCLUDE, calcTotals, normalizeItems, num, withDisplayStatus } from "@/lib/invoices";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const invoice = await db.invoice.findUnique({ where: { id }, include: INVOICE_INCLUDE });
    if (!invoice) return NextResponse.json({ message: "Invoice not found" }, { status: 404 });
    return NextResponse.json(withDisplayStatus(invoice));
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Failed to fetch invoice" }, { status: 500 });
  }
}

// Full edit, including the items (not allowed once PAID or VOID)
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const data = await request.json();
    const existing = await db.invoice.findUnique({ where: { id }, include: { items: true } });
    if (!existing) return NextResponse.json({ message: "Invoice not found" }, { status: 404 });
    if (["PAID", "VOID"].includes(existing.status)) {
      return NextResponse.json(
        { message: `A ${existing.status.toLowerCase()} invoice can no longer be edited` },
        { status: 409 }
      );
    }

    // Items are replaced only when the form sends them
    let newItems = null;
    if (Array.isArray(data.items)) {
      const parsed = normalizeItems(data.items);
      if (parsed.error) return NextResponse.json({ message: parsed.error }, { status: 400 });
      if (parsed.items.length === 0) {
        return NextResponse.json({ message: "An invoice needs at least one item" }, { status: 400 });
      }
      newItems = parsed.items;
    }

    const totals = calcTotals({
      items: newItems ?? existing.items,
      tax: num(data.tax, existing.tax),
      discount: num(data.discount, existing.discount),
      amountPaid: num(data.amountPaid, existing.amountPaid),
    });

    let status = ["DRAFT", "ISSUED", "SENT"].includes(data.status) ? data.status : existing.status;
    if (totals.total > 0 && totals.balance === 0) status = "PAID";

    if (newItems) await db.invoiceItem.deleteMany({ where: { invoiceId: id } });

    const invoice = await db.invoice.update({
      where: { id },
      data: {
        customerName: data.customerName?.trim() || existing.customerName,
        customerEmail: data.customerEmail?.trim() || null,
        customerPhone: data.customerPhone?.trim() || null,
        customerAddress: data.customerAddress?.trim() || null,
        customerTin: data.customerTin?.trim() || null,
        subtotal: totals.subtotal,
        tax: totals.tax,
        discount: totals.discount,
        total: totals.total,
        amountPaid: totals.amountPaid,
        balance: totals.balance,
        status,
        notes: data.notes?.trim() || null,
        issuedAt: data.issuedAt ? new Date(data.issuedAt) : existing.issuedAt,
        dueAt: data.dueAt ? new Date(data.dueAt) : null,
        ...(newItems ? { items: { create: newItems } } : {}),
      },
      include: { items: true },
    });
    return NextResponse.json(invoice);
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: error.message || "Failed to update invoice" }, { status: 500 });
  }
}

// Quick status change: { status: "ISSUED" | "SENT" | "PAID" | "VOID" }
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const { status } = await request.json();
    if (!["ISSUED", "SENT", "PAID", "VOID"].includes(status)) {
      return NextResponse.json({ message: "Invalid status" }, { status: 400 });
    }
    const existing = await db.invoice.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ message: "Invoice not found" }, { status: 404 });
    if (existing.status === "VOID") {
      return NextResponse.json({ message: "A void invoice cannot be changed" }, { status: 409 });
    }

    const data = { status };
    if (status === "PAID") {
      data.amountPaid = existing.total;
      data.balance = 0;
    }
    const invoice = await db.invoice.update({ where: { id }, data });
    return NextResponse.json(invoice);
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Failed to update invoice status" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const existing = await db.invoice.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ message: "Invoice not found" }, { status: 404 });
    if (!["DRAFT", "VOID"].includes(existing.status)) {
      return NextResponse.json({ message: "Only draft or void invoices can be deleted" }, { status: 409 });
    }
    await db.invoiceItem.deleteMany({ where: { invoiceId: id } });
    await db.invoice.delete({ where: { id } });
    return NextResponse.json({ message: "Invoice deleted" });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Failed to delete invoice" }, { status: 500 });
  }
}
