
import { NextResponse } from "next/server";
import db from "@/lib/db";

const isObjectId = (id) => /^[a-f\d]{24}$/i.test(id);

// Walk up from newParentId; if we meet categoryId, the move would create a loop
async function createsCycle(categoryId, newParentId) {
  let currentId = newParentId;
  const seen = new Set();
  while (currentId && !seen.has(currentId)) {
    if (currentId === categoryId) return true;
    seen.add(currentId);
    const current = await db.category.findUnique({
      where: { id: currentId },
      select: { parentId: true },
    });
    currentId = current?.parentId ?? null;
  }
  return false;
}

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!isObjectId(id)) {
      return NextResponse.json({ message: "Invalid category id" }, { status: 400 });
    }

    const category = await db.category.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, name: true } },
        _count: { select: { products: true, children: true } },
      },
    });
    if (!category) {
      return NextResponse.json({ message: "Category not found" }, { status: 404 });
    }
    return NextResponse.json(category);
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Failed to fetch category", error: String(error) }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    if (!isObjectId(id)) {
      return NextResponse.json({ message: "Invalid category id" }, { status: 400 });
    }

    const existing = await db.category.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ message: "Category not found" }, { status: 404 });
    }

    const body = await request.json();
    const data = {};

    if (body.name !== undefined) {
      if (!body.name.trim()) {
        return NextResponse.json({ message: "Category name is required" }, { status: 400 });
      }
      data.name = body.name.trim();
    }
    if (body.slug !== undefined) data.slug = body.slug;
    if (body.description !== undefined) data.description = body.description || null;
    if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl || null;
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

    // Name/slug must stay unique (ignore this category itself)
    if (data.name || data.slug) {
      const clash = await db.category.findFirst({
        where: {
          id: { not: id },
          OR: [
            ...(data.name ? [{ name: data.name }] : []),
            ...(data.slug ? [{ slug: data.slug }] : []),
          ],
        },
      });
      if (clash) {
        return NextResponse.json({ message: "Another category already uses that name or slug" }, { status: 409 });
      }
    }

    if (body.parentId !== undefined) {
      const parentId = body.parentId || null;
      if (parentId) {
        if (!isObjectId(parentId)) {
          return NextResponse.json({ message: "Invalid parent category id" }, { status: 400 });
        }
        if (parentId === id) {
          return NextResponse.json({ message: "A category cannot be its own parent" }, { status: 400 });
        }
        const parent = await db.category.findUnique({ where: { id: parentId } });
        if (!parent) {
          return NextResponse.json({ message: "Parent category not found" }, { status: 400 });
        }
        if (await createsCycle(id, parentId)) {
          return NextResponse.json(
            { message: "Cannot move a category under one of its own sub-categories" },
            { status: 400 }
          );
        }
      }
      data.parentId = parentId;
    }

    const updated = await db.category.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Failed to update category", error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    if (!isObjectId(id)) {
      return NextResponse.json({ message: "Invalid category id" }, { status: 400 });
    }

    const existing = await db.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true, children: true } } },
    });
    if (!existing) {
      return NextResponse.json({ message: "Category not found" }, { status: 404 });
    }

    if (existing._count.products > 0) {
      return NextResponse.json(
        { message: `Cannot delete: category has ${existing._count.products} product(s). Move or delete them first.` },
        { status: 409 }
      );
    }
    if (existing._count.children > 0) {
      return NextResponse.json(
        { message: `Cannot delete: category has ${existing._count.children} sub-category(ies).` },
        { status: 409 }
      );
    }

    await db.category.delete({ where: { id } });
    return NextResponse.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Failed to delete category", error: String(error) }, { status: 500 });
  }
}