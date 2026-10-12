// Route: /api/invoices/eligible-orders
// File: src/app/api/invoices/eligible-orders/route.js
// Orders that do not have an invoice yet (used by the "New Invoice" form)
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { paidTotal } from "@/lib/invoices";

export async function GET() {
  try {
    const invoiced = await db.invoice.findMany({ select: { orderId: true } });
    const invoicedIds = invoiced.map((i) => i.orderId);

    const orders = await db.order.findMany({
      where: { id: { notIn: invoicedIds }, status: { not: "CANCELLED" } },
      include: {
        customer: { select: { name: true, email: true } },
        payments: true,
        items: { include: { product: { select: { name: true, sku: true, brand: true, model: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      orders.map(({ payments, ...order }) => ({ ...order, paidTotal: paidTotal(payments) }))
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Failed to fetch orders" }, { status: 500 });
  }
}