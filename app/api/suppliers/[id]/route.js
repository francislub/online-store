// Route: /api/suppliers/[id]
// File: src/app/api/suppliers/[id]/route.js
import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const supplier = await db.supplier.findUnique({ where: { id } });
    if (!supplier) return NextResponse.json({ message: "Supplier not found" }, { status: 404 });
    return NextResponse.json(supplier);
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Failed to fetch supplier" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const data = await request.json();
    if (!data.name?.trim()) {
      return NextResponse.json({ message: "Supplier name is required" }, { status: 400 });
    }
    const supplier = await db.supplier.update({
      where: { id },
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
    return NextResponse.json(supplier);
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Failed to update supplier" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const used = await db.purchase.count({ where: { supplierId: id } });
    if (used > 0) {
      return NextResponse.json(
        { message: "This supplier has purchases. Mark it inactive instead of deleting." },
        { status: 409 }
      );
    }
    await db.supplier.delete({ where: { id } });
    return NextResponse.json({ message: "Supplier deleted" });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Failed to delete supplier" }, { status: 500 });
  }
}