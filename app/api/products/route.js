// Route: /api/products
// Methods: GET (list + ?search= & ?categoryId=), POST (create), DELETE (bulk delete, body: { ids: [...] })
// File: src/app/api/products/route.js
import { NextResponse } from "next/server";
import db from "@/lib/db";

const isObjectId = (id) => /^[a-f\d]{24}$/i.test(String(id));
const toInt = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
};

export async function GET(request) {
  try {
    const params = new URL(request.url).searchParams;
    const search = params.get("search")?.trim();
    const categoryId = params.get("categoryId");

    const products = await db.product.findMany({
      where: {
        ...(categoryId && isObjectId(categoryId) ? { categoryId } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { sku: { contains: search, mode: "insensitive" } },
                { barcode: { contains: search, mode: "insensitive" } },
                { brand: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { category: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Failed to fetch products", error: String(error) }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const name = body.name?.trim();
    const sku = body.sku?.trim();
    const slug = body.slug?.trim();

    if (!name || !sku || !slug) {
      return NextResponse.json({ message: "Name and SKU are required" }, { status: 400 });
    }
    if (!isObjectId(body.categoryId)) {
      return NextResponse.json({ message: "Please select a category" }, { status: 400 });
    }

    const price = toInt(body.price);
    const salePrice = body.salePrice === "" || body.salePrice == null ? null : toInt(body.salePrice);
    if (price <= 0) {
      return NextResponse.json({ message: "Price must be greater than 0" }, { status: 400 });
    }
    if (salePrice !== null && (salePrice <= 0 || salePrice >= price)) {
      return NextResponse.json({ message: "Sale price must be greater than 0 and less than the price" }, { status: 400 });
    }

    const category = await db.category.findUnique({ where: { id: body.categoryId } });
    if (!category) {
      return NextResponse.json({ message: "Category not found" }, { status: 400 });
    }

    const skuClash = await db.product.findUnique({ where: { sku } });
    if (skuClash) {
      return NextResponse.json({ message: `SKU ${sku} already exists` }, { status: 409 });
    }

    // Keep slug unique: if taken, append the SKU
    let finalSlug = slug;
    if (await db.product.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${slug}-${sku.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      if (await db.product.findUnique({ where: { slug: finalSlug } })) {
        return NextResponse.json({ message: "A product with this name already exists" }, { status: 409 });
      }
    }

    const stock = Math.max(0, toInt(body.stock));

    const product = await db.product.create({
      data: {
        name,
        slug: finalSlug,
        sku,
        barcode: body.barcode?.trim() || null,
        description: body.description || null,
        brand: body.brand?.trim() || null,
        model: body.model?.trim() || null,
        price,
        salePrice,
        costPrice: Math.max(0, toInt(body.costPrice)),
        stock,
        reorderLevel: Math.max(0, toInt(body.reorderLevel, 5)),
        warrantyMonths: Math.max(0, toInt(body.warrantyMonths)),
        imageUrls: Array.isArray(body.imageUrls) ? body.imageUrls.filter(Boolean) : [],
        tags: Array.isArray(body.tags) ? body.tags : [],
        isActive: body.isActive ?? true,
        isFeatured: body.isFeatured ?? false,
        categoryId: body.categoryId,
      },
    });

    // Record opening stock in the stock ledger
    if (stock > 0) {
      await db.stockMovement.create({
        data: {
          productId: product.id,
          type: "OPENING",
          quantity: stock,
          balanceAfter: stock,
          reference: sku,
          notes: "Opening stock on product creation",
        },
      });
    }

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Failed to create product", error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { ids } = await request.json();
    const validIds = Array.isArray(ids) ? ids.filter(isObjectId) : [];

    if (validIds.length === 0) {
      return NextResponse.json({ message: "No product ids provided" }, { status: 400 });
    }

    // Only products that were never sold, purchased or returned can be deleted
    const deletable = await db.product.findMany({
      where: {
        id: { in: validIds },
        orderItems: { none: {} },
        purchaseItems: { none: {} },
        returnItems: { none: {} },
      },
      select: { id: true },
    });
    const deletableIds = deletable.map((p) => p.id);

    if (deletableIds.length > 0) {
      await db.stockMovement.deleteMany({ where: { productId: { in: deletableIds } } });
      await db.product.deleteMany({ where: { id: { in: deletableIds } } });
    }

    const skipped = validIds.length - deletableIds.length;
    return NextResponse.json({
      message:
        skipped > 0
          ? `${deletableIds.length} deleted, ${skipped} skipped (used in orders, purchases or returns)`
          : `${deletableIds.length} product(s) deleted`,
      deleted: deletableIds.length,
      skipped,
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Failed to delete products", error: String(error) }, { status: 500 });
  }
}