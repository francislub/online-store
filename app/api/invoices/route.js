// Route: /api/invoices
// File: src/app/api/invoices/route.js
import { NextResponse } from "next/server";
import db from "@/lib/db";
import {
  calcTotals,
  generateInvoiceNumber,
  itemsFromOrder,
  normalizeItems,
  num,
  paidTotal,
  withDisplayStatus,
} from "@/lib/invoices";

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
        { customerPhone: { contains: search, mode: "insensitive" } },
        { order: { is: { orderNumber: { contains: search, mode: "insensitive" } } } },
      ];
    }

    const invoices = await db.invoice.findMany({
      where,
      include: {
        order: { select: { orderNumber: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(invoices.map(withDisplayStatus));
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Failed to fetch invoices" }, { status: 500 });
  }
}

// Create an invoice. An order is OPTIONAL.
// Body: { orderId?, number?, customerName, customerEmail, customerPhone, customerAddress, customerTin,
//         items: [{ productId?, description, details?, quantity, unitPrice }], tax, discount,
//         amountPaid, status, notes, issuedAt, dueAt }
export async function POST(request) {
  try {
    const data = await request.json();

    // Optional order
    let order = null;
    if (data.orderId) {
      order = await db.order.findUnique({
        where: { id: data.orderId },
        include: { customer: true, payments: true, items: { include: { product: true } } },
      });
      if (!order) return NextResponse.json({ message: "Order not found" }, { status: 404 });

      const existing = await db.invoice.findFirst({
        where: { orderId: order.id, status: { not: "VOID" } },
      });
      if (existing) {
        return NextResponse.json(
          { message: `This order already has invoice ${existing.number}` },
          { status: 409 }
        );
      }
    }

    // Lines: catalog products + custom items typed by hand
    const parsed = normalizeItems(data.items);
    if (parsed.error) return NextResponse.json({ message: parsed.error }, { status: 400 });
    let items = parsed.items;
    if (items.length === 0 && order) items = itemsFromOrder(order);
    if (items.length === 0) {
      return NextResponse.json({ message: "Add at least one item to the invoice" }, { status: 400 });
    }

    const number = data.number?.trim() || (await generateInvoiceNumber());
    const duplicate = await db.invoice.findUnique({ where: { number } });
    if (duplicate) {
      return NextResponse.json({ message: `Invoice number ${number} already exists` }, { status: 409 });
    }

    const totals = calcTotals({
      items,
      tax: num(data.tax, order?.tax ?? 0),
      discount: num(data.discount, order?.discount ?? 0),
      amountPaid: num(data.amountPaid, order ? paidTotal(order.payments) : 0),
    });

    let status = ["DRAFT", "ISSUED", "SENT"].includes(data.status) ? data.status : "ISSUED";
    if (totals.total > 0 && totals.balance === 0) status = "PAID";

    const invoice = await db.invoice.create({
      data: {
        number,
        orderId: order?.id ?? null,
        customerName: data.customerName?.trim() || order?.customer?.name || "Walk-in customer",
        customerEmail: data.customerEmail?.trim() || order?.customer?.email || null,
        customerPhone: data.customerPhone?.trim() || order?.phone || null,
        customerAddress: data.customerAddress?.trim() || order?.address || null,
        customerTin: data.customerTin?.trim() || null,
        subtotal: totals.subtotal,
        tax: totals.tax,
        discount: totals.discount,
        total: totals.total,
        amountPaid: totals.amountPaid,
        balance: totals.balance,
        status,
        notes: data.notes?.trim() || null,
        issuedAt: data.issuedAt ? new Date(data.issuedAt) : new Date(),
        dueAt: data.dueAt ? new Date(data.dueAt) : null,
        items: { create: items },
      },
      include: { items: true },
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
    await db.invoiceItem.deleteMany({ where: { invoiceId: { in: ids } } });
    const result = await db.invoice.deleteMany({ where: { id: { in: ids } } });
    return NextResponse.json({ message: `${result.count} invoice(s) deleted` });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Failed to delete invoices" }, { status: 500 });
  }
}
