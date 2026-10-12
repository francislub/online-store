// app/api/customers/[id]/addresses/[addressId]/route.js
// PUT    -> update address (set isDefault: true to make it the default)
// DELETE -> remove address (promotes another one to default if needed)
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { ADMIN_CASH_SALES, fail, isObjectId, requireRoles } from "@/lib/apiGuard";

export async function PUT(request, { params }) {
  try {
    const { error } = await requireRoles(ADMIN_CASH_SALES);
    if (error) return error;

    const { id, addressId } = await params;
    if (!isObjectId(id) || !isObjectId(addressId)) return fail("Invalid id");

    const existing = await db.address.findFirst({ where: { id: addressId, userId: id } });
    if (!existing) return fail("Address not found", 404);

    const body = await request.json();
    const data = {};
    if (body.label !== undefined) data.label = body.label ? String(body.label).trim() : null;
    if (body.city !== undefined) data.city = body.city ? String(body.city).trim() : null;
    if (body.phone !== undefined) {
      const phone = String(body.phone).trim();
      if (!phone) return fail("Phone is required");
      data.phone = phone;
    }
    if (body.address !== undefined) {
      const address = String(body.address).trim();
      if (!address) return fail("Address is required");
      data.address = address;
    }
    if (body.isDefault === true) {
      await db.address.updateMany({ where: { userId: id }, data: { isDefault: false } });
      data.isDefault = true;
    }

    const updated = await db.address.update({ where: { id: addressId }, data });
    return NextResponse.json({ data: updated, message: "Address updated successfully" });
  } catch (error) {
    console.log(error);
    return fail("Server error: something went wrong", 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { error } = await requireRoles(ADMIN_CASH_SALES);
    if (error) return error;

    const { id, addressId } = await params;
    if (!isObjectId(id) || !isObjectId(addressId)) return fail("Invalid id");

    const existing = await db.address.findFirst({ where: { id: addressId, userId: id } });
    if (!existing) return fail("Address not found", 404);

    await db.address.delete({ where: { id: addressId } });

    if (existing.isDefault) {
      const next = await db.address.findFirst({ where: { userId: id }, orderBy: { createdAt: "desc" } });
      if (next) await db.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }

    return NextResponse.json({ data: { id: addressId }, message: "Address deleted" });
  } catch (error) {
    console.log(error);
    return fail("Server error: something went wrong", 500);
  }
}