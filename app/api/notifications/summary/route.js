// app/api/notifications/summary/route.js
// GET -> { total, byType: {ORDER: 3}, latest: {ORDER: {title, message, createdAt}}, latestAny }
// PUT { types: ["ORDER"] } -> marks every unread notification of those categories as read
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sweepCustomerActivity } from "@/lib/customerNotify";

async function getUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

export async function GET() {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    // safety net: staff dashboards poll this route, so any customer order / sign-up that no route
    // announced gets announced here (throttled, never throws)
    if (user.role && user.role !== "CUSTOMER") await sweepCustomerActivity();

    const [rows, recent] = await Promise.all([
      db.notification.groupBy({
        by: ["type"],
        where: { userId: user.id, readAt: null },
        _count: { _all: true },
      }),
      db.notification.findMany({
        where: { userId: user.id, readAt: null },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: { type: true, title: true, message: true, createdAt: true },
      }),
    ]);

    const byType = {};
    let total = 0;
    for (const r of rows) {
      byType[r.type] = r._count._all;
      total += r._count._all;
    }

    // newest unread message per category: the sidebar button shows it under its name
    const latest = {};
    for (const r of recent) {
      if (!latest[r.type]) latest[r.type] = { title: r.title, message: r.message, createdAt: r.createdAt };
    }
    const latestAny = recent[0]
      ? { title: recent[0].title, message: recent[0].message, createdAt: recent[0].createdAt }
      : null;

    return NextResponse.json({ total, byType, latest, latestAny });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Failed to load summary" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ data: null, message: "Unauthorized" }, { status: 401 });

    const { types } = await request.json();
    if (!Array.isArray(types) || types.length === 0) {
      return NextResponse.json({ data: null, message: "No categories given" }, { status: 400 });
    }

    const result = await db.notification.updateMany({
      where: { userId: user.id, readAt: null, type: { in: types } },
      data: { readAt: new Date() },
    });
    return NextResponse.json({ data: { count: result.count }, message: "Marked as read" });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ data: null, message: "Server error: something went wrong" }, { status: 500 });
  }
}