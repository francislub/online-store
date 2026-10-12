// app/api/notifications/route.js
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, STAFF_ROLES } from "@/lib/auth";
import { sweepOverdueInvoices } from "@/lib/notify";

async function getUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

// GET /api/notifications?filter=all|unread&type=ORDER&page=1&limit=20&countOnly=1
export async function GET(request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const userId = user.id;

    if (searchParams.get("countOnly")) {
      const unreadCount = await db.notification.count({ where: { userId, readAt: null } });
      return NextResponse.json({ unreadCount });
    }

    if (STAFF_ROLES.includes(user.role)) await sweepOverdueInvoices();

    const filter = searchParams.get("filter") === "unread" ? "unread" : "all";
    const type = searchParams.get("type");
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));

    const where = {
      userId,
      ...(filter === "unread" ? { readAt: null } : {}),
      ...(type && type !== "ALL" ? { type } : {}),
    };

    const [items, total, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.notification.count({ where }),
      db.notification.count({ where: { userId, readAt: null } }),
    ]);

    return NextResponse.json({
      items,
      total,
      unreadCount,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Failed to fetch notifications" }, { status: 500 });
  }
}

// PUT body: { ids: [...] } or { all: true }  -> marks as read
export async function PUT(request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ data: null, message: "Unauthorized" }, { status: 401 });

    const { ids, all } = await request.json();
    if (!all && (!Array.isArray(ids) || ids.length === 0)) {
      return NextResponse.json({ data: null, message: "Nothing selected" }, { status: 400 });
    }

    const result = await db.notification.updateMany({
      where: { userId: user.id, readAt: null, ...(all ? {} : { id: { in: ids } }) },
      data: { readAt: new Date() },
    });

    return NextResponse.json({ data: { count: result.count }, message: "Marked as read" });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ data: null, message: "Server error: something went wrong" }, { status: 500 });
  }
}

// DELETE body: { ids: [...] } or { allRead: true }
export async function DELETE(request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ data: null, message: "Unauthorized" }, { status: 401 });

    const { ids, allRead } = await request.json();
    if (!allRead && (!Array.isArray(ids) || ids.length === 0)) {
      return NextResponse.json({ data: null, message: "Nothing selected" }, { status: 400 });
    }

    const result = await db.notification.deleteMany({
      where: { userId: user.id, ...(allRead ? { readAt: { not: null } } : { id: { in: ids } }) },
    });

    return NextResponse.json({ data: { count: result.count }, message: `${result.count} notification(s) deleted` });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ data: null, message: "Server error: something went wrong" }, { status: 500 });
  }
}