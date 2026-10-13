// app/api/storefront/account/addresses/route.js
// POST -> add a delivery address (first one becomes default)
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { jsonError, requireCustomer } from "@/lib/customerAuth";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { customer, error } = await requireCustomer();
    if (error) return error;

    const body = await request.json();
    const phone = String(body.phone ?? "").trim();
    const address = String(body.address ?? "").trim();
    if (!phone || !address) return jsonError("Phone and address are required");

    const count = await db.address.count({ where: { userId: customer.id } });
    const makeDefault = count === 0 || Boolean(body.isDefault);
    if (makeDefault) await db.address.updateMany({ where: { userId: customer.id }, data: { isDefault: false } });

    const created = await db.address.create({
      data: {
        userId: customer.id,
        label: body.label ? String(body.label).trim() : null,
        phone,
        address,
        city: body.city ? String(body.city).trim() : null,
        isDefault: makeDefault,
      },
    });
    return NextResponse.json({ data: created, message: "Address added" }, { status: 201 });
  } catch (err) {
    console.error("[account/addresses POST]", err);
    return jsonError("Server error: something went wrong", 500);
  }
}