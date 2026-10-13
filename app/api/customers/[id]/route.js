// app/api/customers/[id]/route.js
// GET    /api/customers/:id -> customer + addresses + recent orders (with invoices) + payments + stats
// PUT    /api/customers/:id -> partial update (name, email, phone, isActive, password)
// DELETE /api/customers/:id -> delete (admin only, blocked when the customer has history)
import db from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { ADMIN_CASH_SALES, ADMIN_ONLY, fail, isObjectId, requireRoles } from "@/lib/apiGuard";
import { customerSelect, deleteCustomerIfUnused, loadCustomerStats } from "@/lib/customers";

export async function GET(request, { params }) {
  try {
    const { error } = await requireRoles(ADMIN_CASH_SALES);
    if (error) return error;

    const { id } = await params;
    if (!isObjectId(id)) return fail("Invalid customer id");

    const customer = await db.user.findFirst({ where: { id, role: "CUSTOMER" }, select: customerSelect });
    if (!customer) return fail("Customer not found", 404);

    const paymentWhere = { OR: [{ customerId: id }, { order: { customerId: id } }] };

    const [addresses, orders, payments, paidAgg, stats] = await Promise.all([
      db.address.findMany({ where: { userId: id }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] }),
      db.order.findMany({
        where: { customerId: id },
        orderBy: { createdAt: "desc" },
        take: 25,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          createdAt: true,
          // Order -> Invoice is one-to-many in the schema (`invoices Invoice[]`)
          invoices: {
            orderBy: { createdAt: "asc" },
            select: { id: true, number: true, status: true, balance: true },
          },
        },
      }),
      db.payment.findMany({
        where: paymentWhere,
        orderBy: { paidAt: "desc" },
        take: 25,
        select: {
          id: true,
          reference: true,
          amount: true,
          method: true,
          status: true,
          paidAt: true,
          order: { select: { orderNumber: true } },
        },
      }),
      db.payment.aggregate({
        where: { ...paymentWhere, status: { in: ["PAID", "PARTIAL"] } },
        _sum: { amount: true },
      }),
      loadCustomerStats([id]),
    ]);

    return NextResponse.json({
      ...customer,
      addresses,
      orders,
      payments,
      stats: { ...stats[id], totalPaid: paidAgg._sum.amount ?? 0 },
    });
  } catch (error) {
    console.log(error);
    return fail("Failed to fetch customer", 500);
  }
}

export async function PUT(request, { params }) {
  try {
    const { error } = await requireRoles(ADMIN_CASH_SALES);
    if (error) return error;

    const { id } = await params;
    if (!isObjectId(id)) return fail("Invalid customer id");

    const existing = await db.user.findFirst({ where: { id, role: "CUSTOMER" } });
    if (!existing) return fail("Customer not found", 404);

    const body = await request.json();
    const data = {};

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) return fail("Customer name is required");
      data.name = name;
    }

    if (body.email !== undefined && body.email !== "") {
      const email = String(body.email).toLowerCase().trim();
      if (!/^\S+@\S+\.\S+$/.test(email)) return fail("Invalid email address");
      if (email !== existing.email) {
        const taken = await db.user.findUnique({ where: { email } });
        if (taken) return fail("A user with this email already exists", 409);
        data.email = email;
      }
    }

    if (body.phone !== undefined) data.phone = body.phone ? String(body.phone).trim() : null;
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

    if (body.password) {
      if (String(body.password).length < 8) return fail("Password must be at least 8 characters");
      data.passwordHash = await bcrypt.hash(String(body.password), 10);
    }

    if (Object.keys(data).length === 0) return fail("Nothing to update");

    const updated = await db.user.update({ where: { id }, data, select: customerSelect });
    return NextResponse.json({ data: updated, message: "Customer updated successfully" });
  } catch (error) {
    console.log(error);
    return fail("Server error: something went wrong", 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { error } = await requireRoles(ADMIN_ONLY);
    if (error) return error;

    const { id } = await params;
    if (!isObjectId(id)) return fail("Invalid customer id");

    const result = await deleteCustomerIfUnused(id);
    if (!result.ok) return fail(result.reason, result.reason === "Customer not found" ? 404 : 409);

    return NextResponse.json({ data: { id }, message: "Customer deleted" });
  } catch (error) {
    console.log(error);
    return fail("Server error: something went wrong", 500);
  }
}