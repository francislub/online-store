// app/api/orders/[id]/invoice/route.js
// Creates an invoice for an order that doesn't have an active (non-void) one yet.
// Invoice lines are copied from the order items, so the invoice prints correctly.
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { requireRole, ROLES, handleError, ServiceError, audit } from "@/lib/apiAuth";
import { calcTotals, generateInvoiceNumber, itemsFromOrder, num, paidTotal } from "@/lib/invoices";

export async function POST(request, { params }) {
  try {
    const { user, error } = await requireRole(ROLES.ORDERS);
    if (error) return error;
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const invoice = await db.$transaction(
      async (tx) => {
        const order = await tx.order.findUnique({
          where: { id },
          include: { customer: true, payments: true, items: { include: { product: true } } },
        });
        if (!order) throw new ServiceError("Order not found", 404);
        if (order.status === "CANCELLED") throw new ServiceError("Cancelled orders can't be invoiced", 409);

        const existing = await tx.invoice.findFirst({ where: { orderId: id, status: { not: "VOID" } } });
        if (existing) throw new ServiceError(`This order already has invoice ${existing.number}`, 409);

        const items = itemsFromOrder(order);
        if (items.length === 0) throw new ServiceError("This order has no items to invoice", 409);

        const number = body.number?.trim() || (await generateInvoiceNumber());
        const duplicate = await tx.invoice.findUnique({ where: { number } });
        if (duplicate) throw new ServiceError(`Invoice number ${number} already exists`, 409);

        const totals = calcTotals({
          items,
          tax: num(body.tax, order.tax),
          discount: num(body.discount, order.discount),
          amountPaid: num(body.amountPaid, paidTotal(order.payments)),
        });

        let status = ["DRAFT", "ISSUED", "SENT"].includes(body.status) ? body.status : "ISSUED";
        if (totals.total > 0 && totals.balance === 0) status = "PAID";

        const created = await tx.invoice.create({
          data: {
            number,
            orderId: order.id,
            customerName: body.customerName?.trim() || order.customer?.name || "Walk-in customer",
            customerEmail: body.customerEmail?.trim() || order.customer?.email || null,
            customerPhone: body.customerPhone?.trim() || order.phone || null,
            customerAddress: body.customerAddress?.trim() || order.address || null,
            customerTin: body.customerTin?.trim() || null,
            subtotal: totals.subtotal,
            tax: totals.tax,
            discount: totals.discount,
            total: totals.total,
            amountPaid: totals.amountPaid,
            balance: totals.balance,
            status,
            notes: body.notes?.trim() || null,
            issuedAt: body.issuedAt ? new Date(body.issuedAt) : new Date(),
            dueAt: body.dueAt ? new Date(body.dueAt) : null,
            items: { create: items },
          },
          include: { items: true },
        });

        await audit(tx, user.id, "INVOICE_CREATED", "Invoice", created.id, {
          number: created.number,
          order: order.orderNumber,
        });
        return created;
      },
      { timeout: 30000 }
    );

    return NextResponse.json({ data: invoice, message: "Invoice created successfully" }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}