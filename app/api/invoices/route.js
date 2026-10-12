// Route: /api/invoices
// File: src/app/api/invoices/route.js
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { generateInvoiceNumber, num, paidTotal, withDisplayStatus } from "@/lib/invoices";

const STATUSES = ["DRAFT", "ISSUED", "SENT", "PAID", "OVERDUE", "VOID"];

export async function GET(request) {
  try {
    const search = request.nextUrl.searchParams.get("search")?.trim();
    const status = request.nextUrl.searchParams.get("status");

    const where = {};
    if (status === "OVERDUE") {
      where.status = { in: ["ISSUED", "SENT"] };
      where.balance = { gt: 0 };
      where.dueAt = { lt: new Date() };
    } else if (status && STATUSES.includes(status)) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { number: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { order: { orderNumber: { contains: search, mode: "insensitive" } } },
      ];
    }

    const invoices = await db.invoice.findMany({
      where,
      include: { order: { select: { orderNumber: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(invoices.map(withDisplayStatus));
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Failed to fetch invoices" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    if (!data.orderId) {
      return NextResponse.json({ message: "Select an order to invoice" }, { status: 400 });
    }

    const order = await db.order.findUnique({
      where: { id: data.orderId },
      include: { customer: true, payments: true, invoice: true },
    });
    if (!order) return NextResponse.json({ message: "Order not found" }, { status: 404 });
    if (order.invoice) {
      return NextResponse.json({ message: "This order already has an invoice" }, { status: 409 });
    }

    const number = data.number?.trim() || (await generateInvoiceNumber());
    const duplicate = await db.invoice.findUnique({ where: { number } });
    if (duplicate) {
      return NextResponse.json({ message: `Invoice number ${number} already exists` }, { status: 409 });
    }

    const subtotal = order.subtotal;
    const tax = num(data.tax, order.tax);
    const discount = num(data.discount, order.discount);
    const total = Math.max(0, subtotal + tax - discount);
    const amountPaid = Math.max(0, num(data.amountPaid, paidTotal(order.payments)));
    const balance = Math.max(0, total - amountPaid);

    let status = ["DRAFT", "ISSUED", "SENT"].includes(data.status) ? data.status : "ISSUED";
    if (total > 0 && balance === 0) status = "PAID";

    const invoice = await db.invoice.create({
      data: {
        number,
        orderId: order.id,
        customerName: data.customerName?.trim() || order.customer?.name || "Walk-in customer",
        customerEmail: data.customerEmail?.trim() || order.customer?.email || null,
        customerTin: data.customerTin?.trim() || null,
        subtotal,
        tax,
        discount,
        total,
        amountPaid,
        balance,
        status,
        notes: data.notes || null,
        issuedAt: data.issuedAt ? new Date(data.issuedAt) : new Date(),
        dueAt: data.dueAt ? new Date(data.dueAt) : null,
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: error.message || "Failed to create invoice" }, { status: 500 });
  }
}

// Bulk delete: { ids: [...] } (only DRAFT / VOID invoices)
export async function DELETE(request) {
  try {
    const { ids } = await request.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ message: "No invoices selected" }, { status: 400 });
    }
    const locked = await db.invoice.count({
      where: { id: { in: ids }, status: { notIn: ["DRAFT", "VOID"] } },
    });
    if (locked > 0) {
      return NextResponse.json({ message: "Only draft or void invoices can be deleted" }, { status: 409 });
    }
    const result = await db.invoice.deleteMany({ where: { id: { in: ids } } });
    return NextResponse.json({ message: `${result.count} invoice(s) deleted` });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Failed to delete invoices" }, { status: 500 });
  }
}