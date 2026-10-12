// Route: /api/expenses/[id]
// File: src/app/api/expenses/[id]/route.js
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { parseExpense } from "@/lib/expenses";
import { isDay, noonOfDay } from "@/lib/dates";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const expense = await db.expense.findUnique({
      where: { id },
      include: { recordedBy: { select: { name: true } } },
    });
    if (!expense) return NextResponse.json({ message: "Expense not found" }, { status: 404 });
    return NextResponse.json(expense);
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Failed to fetch expense" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const data = await request.json();
    const existing = await db.expense.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ message: "Expense not found" }, { status: 404 });

    const parsed = parseExpense(data);
    if (parsed.error) return NextResponse.json({ message: parsed.error }, { status: 400 });

    const expense = await db.expense.update({
      where: { id },
      data: {
        ...parsed.value,
        spentAt: isDay(data.spentAt) ? noonOfDay(data.spentAt) : existing.spentAt,
      },
    });
    return NextResponse.json(expense);
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: error.message || "Failed to update expense" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const existing = await db.expense.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ message: "Expense not found" }, { status: 404 });
    await db.expense.delete({ where: { id } });
    return NextResponse.json({ message: "Expense deleted" });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Failed to delete expense" }, { status: 500 });
  }
}