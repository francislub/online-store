// Route: /api/stock-movements
// File: src/app/api/stock-movements/route.js
import { NextResponse } from "next/server";
import db from "@/lib/db";

const TYPES = ["PURCHASE", "SALE", "RETURN_IN", "RETURN_OUT", "ADJUSTMENT", "DAMAGED", "OPENING"];
const MANUAL_TYPES = ["ADJUSTMENT", "DAMAGED", "OPENING"];

export async function GET(request) {
  try {
    const search = request.nextUrl.searchParams.get("search")?.trim();
    const type = request.nextUrl.searchParams.get("type");
    const productId = request.nextUrl.searchParams.get("productId");

    const where = {};
    if (type && TYPES.includes(type)) where.type = type;
    if (productId) where.productId = productId;
    if (search) {
      where.OR = [
        { reference: { contains: search, mode: "insensitive" } },
        { product: { name: { contains: search, mode: "insensitive" } } },
        { product: { sku: { contains: search, mode: "insensitive" } } },
      ];
    }

    const movements = await db.stockMovement.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, sku: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });
    return NextResponse.json(movements);
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Failed to fetch stock movements" }, { status: 500 });
  }
}

// Manual movement: { productId, type: ADJUSTMENT | DAMAGED | OPENING, quantity, notes, createdById? }
// ADJUSTMENT uses the signed quantity as entered. DAMAGED is always stock out. OPENING is always stock in.
export async function POST(request) {
  try {
    const data = await request.json();
    if (!data.productId) return NextResponse.json({ message: "Select a product" }, { status: 400 });
    if (!MANUAL_TYPES.includes(data.type)) {
      return NextResponse.json({ message: "Invalid movement type" }, { status: 400 });
    }

    let quantity = Number(data.quantity);
    if (!Number.isInteger(quantity) || quantity === 0) {
      return NextResponse.json({ message: "Quantity must be a whole number and not 0" }, { status: 400 });
    }
    if (data.type === "DAMAGED") quantity = -Math.abs(quantity);
    if (data.type === "OPENING") quantity = Math.abs(quantity);

    const movement = await db.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: data.productId } });
      if (!product) throw new Error("Product not found");
      if (product.stock + quantity < 0) {
        throw new Error(`Not enough stock. ${product.name} only has ${product.stock} in stock`);
      }
      const updated = await tx.product.update({
        where: { id: data.productId },
        data: { stock: { increment: quantity } },
      });
      return tx.stockMovement.create({
        data: {
          productId: data.productId,
          type: data.type,
          quantity,
          balanceAfter: updated.stock,
          reference: data.reference || null,
          notes: data.notes || null,
          createdById: data.createdById || null,
        },
      });
    });

    return NextResponse.json(movement, { status: 201 });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: error.message || "Failed to record movement" }, { status: 400 });
  }
}