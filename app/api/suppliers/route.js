// Route: /api/suppliers
// File: src/app/api/suppliers/route.js
import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request) {
  try {
    const search = request.nextUrl.searchParams.get("search")?.trim();
    const suppliers = await db.supplier.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { contactName: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(suppliers);
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Failed to fetch suppliers" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    if (!data.name?.trim()) {
      return NextResponse.json({ message: "Supplier name is required" }, { status: 400 });
    }
    const supplier = await db.supplier.create({
      data: {
        name: data.name.trim(),
        contactName: data.contactName || null,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        balance: Number(data.balance) || 0,
        isActive: data.isActive ?? true,
      },
    });
    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Failed to create supplier" }, { status: 500 });
  }
}

// Bulk delete: { ids: [...] }
export async function DELETE(request) {
  try {
    const { ids } = await request.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ message: "No suppliers selected" }, { status: 400 });
    }
    const used = await db.purchase.count({ where: { supplierId: { in: ids } } });
    if (used > 0) {
      return NextResponse.json(
        { message: "Some suppliers have purchases. Mark them inactive instead of deleting." },
        { status: 409 }
      );
    }
    const result = await db.supplier.deleteMany({ where: { id: { in: ids } } });
    return NextResponse.json({ message: `${result.count} supplier(s) deleted` });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Failed to delete suppliers" }, { status: 500 });
  }
}