// Route: /api/categories
// Methods: GET (list + ?search=), POST (create), DELETE (bulk delete, body: { ids: [...] })
// File: src/app/api/categories/route.js
import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request) {
  try {
    const search = new URL(request.url).searchParams.get("search")?.trim();

    const categories = await db.category.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { slug: { contains: search, mode: "insensitive" } },
            ],
          }
        : undefined,
      include: {
        parent: { select: { id: true, name: true } },
        _count: { select: { products: true, children: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Failed to fetch categories", error: String(error) }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name, slug, imageUrl, description, isActive, parentId } = await request.json();

    if (!name || !slug) {
      return NextResponse.json({ message: "Category name is required" }, { status: 400 });
    }

    const existing = await db.category.findFirst({
      where: { OR: [{ slug }, { name }] },
    });
    if (existing) {
      return NextResponse.json({ data: null, message: "Category already exists" }, { status: 409 });
    }

    if (parentId) {
      const parent = await db.category.findUnique({ where: { id: parentId } });
      if (!parent) {
        return NextResponse.json({ message: "Parent category not found" }, { status: 400 });
      }
    }

    const newCategory = await db.category.create({
      data: {
        name,
        slug,
        imageUrl: imageUrl || null,
        description: description || null,
        isActive: isActive ?? true,
        parentId: parentId || null,
      },
    });

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Failed to create category", error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ message: "No category ids provided" }, { status: 400 });
    }

    // Skip categories that still have products or sub-categories
    const result = await db.category.deleteMany({
      where: { id: { in: ids }, products: { none: {} }, children: { none: {} } },
    });

    const skipped = ids.length - result.count;
    return NextResponse.json({
      message:
        skipped > 0
          ? `${result.count} deleted, ${skipped} skipped (have products or sub-categories)`
          : `${result.count} category(ies) deleted`,
      deleted: result.count,
      skipped,
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Failed to delete categories", error: String(error) }, { status: 500 });
  }
}