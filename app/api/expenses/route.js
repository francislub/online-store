// Route: /api/expenses
// File: src/app/api/expenses/route.js
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { CATEGORIES, parseExpense, resolveRecordedById } from "@/lib/expenses";
import { endOfDay, isDay, noonOfDay, startOfDay } from "@/lib/dates";

export async function GET(request) {
  try {
    const params = request.nextUrl.searchParams;
    const search = params.get("search")?.trim();
    const category = params.get("category");
    const from = params.get("from");
    const to = params.get("to");

    const where = {};
    if (category && CATEGORIES.includes(category)) where.category = category;
    if (isDay(from) || isDay(to)) {
      where.spentAt = {};
      if (isDay(from)) where.spentAt.gte = startOfDay(from);
      if (isDay(to)) where.spentAt.lte = endOfDay(to);
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const expenses = await db.expense.findMany({
      where,
      include: { recordedBy: { select: { name: true } } },
      orderBy: { spentAt: "desc" },
    });
    return NextResponse.json(expenses);
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const parsed = parseExpense(data);
    if (parsed.error) return NextResponse.json({ message: parsed.error }, { status: 400 });

    const recordedById = await resolveRecordedById(data);
    if (!recordedById) {
      return NextResponse.json({ message: "No user found to record this expense" }, { status: 400 });
    }

    const expense = await db.expense.create({
      data: {
        ...parsed.value,
        recordedById,
        spentAt: isDay(data.spentAt) ? noonOfDay(data.spentAt) : new Date(),
      },
    });
    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: error.message || "Failed to create expense" }, { status: 500 });
  }
}

// Bulk delete: { ids: [...] }
export async function DELETE(request) {
  try {
    const { ids } = await request.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ message: "No expenses selected" }, { status: 400 });
    }
    const result = await db.expense.deleteMany({ where: { id: { in: ids } } });
    return NextResponse.json({ message: `${result.count} expense(s) deleted` });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Failed to delete expenses" }, { status: 500 });
  }
}