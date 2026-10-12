// app/api/customers/[id]/addresses/route.js
// GET  /api/customers/:id/addresses -> list
// POST /api/customers/:id/addresses -> add address (first one becomes default)
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { ADMIN_CASH_SALES, fail, isObjectId, requireRoles } from "@/lib/apiGuard";

export async function GET(request, { params }) {
  try {
    const { error } = await requireRoles(ADMIN_CASH_SALES);
    if (error) return error;

    const { id } = await params;
    if (!isObjectId(id)) return fail("Invalid customer id");

    const addresses = await db.address.findMany({
      where: { userId: id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(addresses);
  } catch (error) {
    console.log(error);
    return fail("Failed to fetch addresses", 500);
  }
}

export async function POST(request, { params }) {
  try {
    const { error } = await requireRoles(ADMIN_CASH_SALES);
    if (error) return error;

    const { id } = await params;
    if (!isObjectId(id)) return fail("Invalid customer id");

    const customer = await db.user.findFirst({ where: { id, role: "CUSTOMER" }, select: { id: true } });
    if (!customer) return fail("Customer not found", 404);

    const body = await request.json();
    const phone = String(body.phone ?? "").trim();
    const address = String(body.address ?? "").trim();
    if (!phone || !address) return fail("Phone and address are required");

    const count = await db.address.count({ where: { userId: id } });
    const makeDefault = count === 0 || Boolean(body.isDefault);

    if (makeDefault) {
      await db.address.updateMany({ where: { userId: id }, data: { isDefault: false } });
    }

    const created = await db.address.create({
      data: {
        userId: id,
        label: body.label ? String(body.label).trim() : null,
        phone,
        address,
        city: body.city ? String(body.city).trim() : null,
        isDefault: makeDefault,
      },
    });

    return NextResponse.json({ data: created, message: "Address added successfully" }, { status: 201 });
  } catch (error) {
    console.log(error);
    return fail("Server error: something went wrong", 500);
  }
}