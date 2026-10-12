// app/api/customers/route.js
// GET    /api/customers?search=&status=active|inactive  -> list with order/spend/balance stats
// POST   /api/customers                                 -> create customer (+ optional first address)
// DELETE /api/customers  { ids: [...] }                 -> bulk delete (admin only, skips customers with history)
import db from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { ADMIN_CASH_SALES, ADMIN_ONLY, fail, isObjectId, requireRoles } from "@/lib/apiGuard";
import { customerSelect, deleteCustomerIfUnused, loadCustomerStats, makePlaceholderEmail } from "@/lib/customers";

export async function GET(request) {
  try {
    const { error } = await requireRoles(ADMIN_CASH_SALES);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").trim();
    const status = searchParams.get("status");

    const where = { role: "CUSTOMER" };
    if (status === "active") where.isActive = true;
    if (status === "inactive") where.isActive = false;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    const customers = await db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: customerSelect,
    });

    const stats = await loadCustomerStats(customers.map((c) => c.id));
    return NextResponse.json(customers.map((c) => ({ ...c, ...stats[c.id] })));
  } catch (error) {
    console.log(error);
    return fail("Failed to fetch customers", 500);
  }
}

export async function POST(request) {
  try {
    const { error } = await requireRoles(ADMIN_CASH_SALES);
    if (error) return error;

    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const phone = body.phone ? String(body.phone).trim() : null;
    const rawEmail = body.email ? String(body.email).toLowerCase().trim() : "";
    const password = body.password ? String(body.password) : "";
    const address = body.address && body.address.address ? body.address : null;

    if (!name) return fail("Customer name is required");
    if (!rawEmail && !phone) return fail("Provide at least a phone number or an email");
    if (rawEmail && !/^\S+@\S+\.\S+$/.test(rawEmail)) return fail("Invalid email address");
    if (password && password.length < 8) return fail("Password must be at least 8 characters");

    const email = rawEmail || makePlaceholderEmail();

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) return fail("A user with this email already exists", 409);

    let addressData;
    if (address) {
      const addressPhone = (address.phone || phone || "").trim();
      if (!addressPhone) return fail("Address needs a phone number");
      addressData = {
        create: [
          {
            label: address.label ? String(address.label).trim() : null,
            phone: addressPhone,
            address: String(address.address).trim(),
            city: address.city ? String(address.city).trim() : null,
            isDefault: true,
          },
        ],
      };
    }

    const customer = await db.user.create({
      data: {
        name,
        email,
        phone,
        role: "CUSTOMER",
        isActive: body.isActive !== false,
        passwordHash: password ? await bcrypt.hash(password, 10) : null,
        ...(addressData ? { addresses: addressData } : {}),
      },
      select: customerSelect,
    });

    return NextResponse.json({ data: customer, message: "Customer created successfully" }, { status: 201 });
  } catch (error) {
    console.log(error);
    return fail("Server error: something went wrong", 500);
  }
}

export async function DELETE(request) {
  try {
    const { error } = await requireRoles(ADMIN_ONLY);
    if (error) return error;

    const { ids } = await request.json();
    if (!Array.isArray(ids) || ids.length === 0) return fail("No customers selected");

    let deleted = 0;
    const skipped = [];
    for (const id of ids) {
      if (!isObjectId(id)) {
        skipped.push({ id, reason: "Invalid id" });
        continue;
      }
      const result = await deleteCustomerIfUnused(id);
      if (result.ok) deleted += 1;
      else skipped.push({ id, reason: result.reason });
    }

    const message = skipped.length
      ? `${deleted} deleted, ${skipped.length} skipped (customers with history should be deactivated)`
      : `${deleted} customer(s) deleted`;

    if (deleted === 0 && skipped.length) return NextResponse.json({ data: { deleted, skipped }, message }, { status: 409 });
    return NextResponse.json({ data: { deleted, skipped }, message });
  } catch (error) {
    console.log(error);
    return fail("Server error: something went wrong", 500);
  }
}