// Route: /api/invoices/products?search=
// File: src/app/api/invoices/products/route.js
// Product lookup for the invoice form's "Add product from catalog" search box.
import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request) {
  try {
    const search = request.nextUrl.searchParams.get("search")?.trim();

    const where = { isActive: true };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { barcode: { contains: search, mode: "insensitive" } },
        { brand: { contains: search, mode: "insensitive" } },
        { model: { contains: search, mode: "insensitive" } },
      ];
    }

    const products = await db.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        sku: true,
        brand: true,
        model: true,
        price: true,
        salePrice: true,
        stock: true,
        warrantyMonths: true,
      },
      orderBy: { name: "asc" },
      take: 20,
    });

    return NextResponse.json(products);
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Failed to search products" }, { status: 500 });
  }
}
