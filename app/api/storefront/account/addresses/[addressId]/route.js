// app/api/storefront/account/addresses/[addressId]/route.js
// PUT    -> update (isDefault: true makes it the default)
// DELETE -> remove (promotes another address if the default was removed)
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { jsonError, requireCustomer } from "@/lib/customerAuth";

export const runtime = "nodejs";

const isObjectId = (v) => /^[a-f\d]{24}$/i.test(String(v));

export async function PUT(request, { params }) {
  try {
    const { customer, error } = await requireCustomer();
    if (error) return error;

    const { addressId } = await params;
    if (!isObjectId(addressId)) return jsonError("Invalid id");

    const existing = await db.address.findFirst({ where: { id: addressId, userId: customer.id } });
    if (!existing) return jsonError("Address not found", 404);

    const body = await request.json();
    const data = {};
    if (body.label !== undefined) data.label = body.label ? String(body.label).trim() : null;
    if (body.city !== undefined) data.city = body.city ? String(body.city).trim() : null;
    if (body.phone !== undefined) {
      const phone = String(body.phone).trim();
      if (!phone) return jsonError("Phone is required");
      data.phone = phone;
    }
    if (body.address !== undefined) {
      const address = String(body.address).trim();
      if (!address) return jsonError("Address is required");
      data.address = address;
    }
    if (body.isDefault === true) {
      await db.address.updateMany({ where: { userId: customer.id }, data: { isDefault: false } });
      data.isDefault = true;
    }

    const updated = await db.address.update({ where: { id: addressId }, data });
    return NextResponse.json({ data: updated, message: "Address updated" });
  } catch (err) {
    console.error("[account/addresses PUT]", err);
    return jsonError("Server error: something went wrong", 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { customer, error } = await requireCustomer();
    if (error) return error;

    const { addressId } = await params;
    if (!isObjectId(addressId)) return jsonError("Invalid id");

    const existing = await db.address.findFirst({ where: { id: addressId, userId: customer.id } });
    if (!existing) return jsonError("Address not found", 404);

    await db.address.delete({ where: { id: addressId } });
    if (existing.isDefault) {
      const next = await db.address.findFirst({ where: { userId: customer.id }, orderBy: { createdAt: "desc" } });
      if (next) await db.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }
    return NextResponse.json({ data: { id: addressId }, message: "Address deleted" });
  } catch (err) {
    console.error("[account/addresses DELETE]", err);
    return jsonError("Server error: something went wrong", 500);
  }
}