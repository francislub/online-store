// Route: /api/products/[id]
// Methods: GET (view one), PUT (update), DELETE (delete one)
// File: src/app/api/products/[id]/route.js
import { NextResponse } from "next/server";
import db from "@/lib/db";

const isObjectId = (id) => /^[a-f\d]{24}$/i.test(String(id));
const toInt = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
};

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!isObjectId(id)) {
      return NextResponse.json({ message: "Invalid product id" }, { status: 400 });
    }

    const product = await db.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        _count: { select: { orderItems: true, purchaseItems: true, returnItems: true } },
      },
    });
    if (!product) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Failed to fetch product", error: String(error) }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    if (!isObjectId(id)) {
      return NextResponse.json({ message: "Invalid product id" }, { status: 400 });
    }

    const existing = await db.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }

    const body = await request.json();
    const data = {};

    if (body.name !== undefined) {
      if (!body.name.trim()) {
        return NextResponse.json({ message: "Name is required" }, { status: 400 });
      }
      data.name = body.name.trim();
    }

    if (body.sku !== undefined) {
      const sku = body.sku.trim();
      if (!sku) {
        return NextResponse.json({ message: "SKU is required" }, { status: 400 });
      }
      if (sku !== existing.sku) {
        const clash = await db.product.findUnique({ where: { sku } });
        if (clash) {
          return NextResponse.json({ message: `SKU ${sku} already exists` }, { status: 409 });
        }
      }
      data.sku = sku;
    }

    if (body.categoryId !== undefined) {
      if (!isObjectId(body.categoryId)) {
        return NextResponse.json({ message: "Invalid category" }, { status: 400 });
      }
      const category = await db.category.findUnique({ where: { id: body.categoryId } });
      if (!category) {
        return NextResponse.json({ message: "Category not found" }, { status: 400 });
      }
      data.categoryId = body.categoryId;
    }

    // Price checks use the new value if sent, otherwise the stored one
    const price = body.price !== undefined ? toInt(body.price) : existing.price;
    const salePrice =
      body.salePrice !== undefined
        ? body.salePrice === "" || body.salePrice === null
          ? null
          : toInt(body.salePrice)
        : existing.salePrice;

    if (price <= 0) {
      return NextResponse.json({ message: "Price must be greater than 0" }, { status: 400 });
    }
    if (salePrice !== null && (salePrice <= 0 || salePrice >= price)) {
      return NextResponse.json({ message: "Sale price must be greater than 0 and less than the price" }, { status: 400 });
    }
    data.price = price;
    data.salePrice = salePrice;

    if (body.barcode !== undefined) data.barcode = body.barcode?.trim() || null;
    if (body.description !== undefined) data.description = body.description || null;
    if (body.brand !== undefined) data.brand = body.brand?.trim() || null;
    if (body.model !== undefined) data.model = body.model?.trim() || null;
    if (body.costPrice !== undefined) data.costPrice = Math.max(0, toInt(body.costPrice));
    if (body.reorderLevel !== undefined) data.reorderLevel = Math.max(0, toInt(body.reorderLevel, 5));
    if (body.warrantyMonths !== undefined) data.warrantyMonths = Math.max(0, toInt(body.warrantyMonths));
    if (Array.isArray(body.imageUrls)) data.imageUrls = body.imageUrls.filter(Boolean);
    if (Array.isArray(body.tags)) data.tags = body.tags;
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
    if (body.isFeatured !== undefined) data.isFeatured = Boolean(body.isFeatured);

    // Stock change -> record an ADJUSTMENT movement for the difference
    let stockDiff = 0;
    if (body.stock !== undefined) {
      const newStock = Math.max(0, toInt(body.stock));
      stockDiff = newStock - existing.stock;
      data.stock = newStock;
    }

    const updated = await db.product.update({ where: { id }, data });

    if (stockDiff !== 0) {
      await db.stockMovement.create({
        data: {
          productId: id,
          type: "ADJUSTMENT",
          quantity: stockDiff,
          balanceAfter: updated.stock,
          reference: updated.sku,
          notes: "Manual stock adjustment from product edit",
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Failed to update product", error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    if (!isObjectId(id)) {
      return NextResponse.json({ message: "Invalid product id" }, { status: 400 });
    }

    const existing = await db.product.findUnique({
      where: { id },
      include: { _count: { select: { orderItems: true, purchaseItems: true, returnItems: true } } },
    });
    if (!existing) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }

    const { orderItems, purchaseItems, returnItems } = existing._count;
    if (orderItems + purchaseItems + returnItems > 0) {
      return NextResponse.json(
        {
          message: "Cannot delete: this product is used in orders, purchases or returns. Deactivate it instead.",
        },
        { status: 409 }
      );
    }

    await db.stockMovement.deleteMany({ where: { productId: id } });
    await db.product.delete({ where: { id } });

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Failed to delete product", error: String(error) }, { status: 500 });
  }
}