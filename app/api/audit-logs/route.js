// app/api/audit-logs/route.js
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/audit-logs?page=1&limit=25&entity=Order&q=ORDER_&actorId=...&from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 25));
    const entity = searchParams.get("entity");
    const actorId = searchParams.get("actorId");
    const q = searchParams.get("q")?.trim();
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const createdAt = {};
    if (from) createdAt.gte = new Date(`${from}T00:00:00+03:00`);
    if (to) createdAt.lte = new Date(`${to}T23:59:59.999+03:00`);

    const where = {
      ...(entity && entity !== "ALL" ? { entity } : {}),
      ...(actorId ? { actorId } : {}),
      ...(Object.keys(createdAt).length ? { createdAt } : {}),
      ...(q
        ? {
            OR: [
              { action: { contains: q, mode: "insensitive" } },
              { entityId: { contains: q, mode: "insensitive" } },
              { actor: { name: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const [items, total, entityRows] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { actor: { select: { id: true, name: true, email: true, role: true } } },
      }),
      db.auditLog.count({ where }),
      db.auditLog.findMany({ distinct: ["entity"], select: { entity: true } }),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
      entities: entityRows.map((e) => e.entity).sort(),
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Failed to fetch audit logs" }, { status: 500 });
  }
}