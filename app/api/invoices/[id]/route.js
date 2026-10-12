// Route: /api/invoices/[id]
// File: src/app/api/invoices/[id]/route.js
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { INVOICE_INCLUDE, num, withDisplayStatus } from "@/lib/invoices";

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

// Full edit (not allowed once PAID or VOID)
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const data = await request.json();
    const existing = await db.invoice.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ message: "Invoice not found" }, { status: 404 });
    if (["PAID", "VOID"].includes(existing.status)) {
      return NextResponse.json(
        { message: `A ${existing.status.toLowerCase()} invoice can no longer be edited` },
        { status: 409 }
      );
    }

    const tax = num(data.tax, existing.tax);
    const discount = num(data.discount, existing.discount);
    const total = Math.max(0, existing.subtotal + tax - discount);
    const amountPaid = Math.max(0, num(data.amountPaid, existing.amountPaid));
    const balance = Math.max(0, total - amountPaid);

    let status = ["DRAFT", "ISSUED", "SENT"].includes(data.status) ? data.status : existing.status;
    if (total > 0 && balance === 0) status = "PAID";

    const invoice = await db.invoice.update({
      where: { id },
      data: {
        customerName: data.customerName?.trim() || existing.customerName,
        customerEmail: data.customerEmail?.trim() || null,
        customerTin: data.customerTin?.trim() || null,
        tax,
        discount,
        total,
        amountPaid,
        balance,
        status,
        notes: data.notes || null,
        issuedAt: data.issuedAt ? new Date(data.issuedAt) : existing.issuedAt,
        dueAt: data.dueAt ? new Date(data.dueAt) : null,
      },
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
    await db.invoice.delete({ where: { id } });
    return NextResponse.json({ message: "Invoice deleted" });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Failed to delete invoice" }, { status: 500 });
  }
}