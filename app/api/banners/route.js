// app/api/banners/route.js
// Route: /api/banners  (GET, POST, DELETE)
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/adminGuard";
import { logAudit } from "@/lib/audit";
import { buildBannerWhere, isValidId, parseBannerBody } from "@/lib/banners";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TAG = "[api/banners]";
const log = (...a) => console.log(TAG, ...a);
const logError = (step, err) =>
  console.error(`${TAG} ERROR at "${step}":`, err?.code || "", err?.message || err, err?.meta || "");

// GET /api/banners?q=&status=active|inactive
// GET /api/banners?active=true  -> public (storefront), active banners only
export async function GET(request) {
  log("GET hit:", request.url);
  try {
    const { searchParams } = new URL(request.url);
    const publicOnly = searchParams.get("active") === "true";

    if (!publicOnly) {
      const { error } = await requireAdmin();
      if (error) {
        log("GET blocked by requireAdmin:", error.status);
        return error;
      }
    }

    const where = publicOnly
      ? { isActive: true }
      : buildBannerWhere(searchParams.get("q"), searchParams.get("status"));

    const banners = await db.banner.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    log("GET found:", banners.length);
    return NextResponse.json({ data: banners });
  } catch (err) {
    logError("GET", err);
    return NextResponse.json({ message: "Failed to fetch banners" }, { status: 500 });
  }
}

export async function POST(request) {
  log("POST hit");
  const { session, error } = await requireAdmin();
  if (error) {
    log("POST blocked by requireAdmin:", error.status);
    return error;
  }

  try {
    let body;
    try {
      body = await request.json();
    } catch (err) {
      return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
    }
    log("POST body:", body);

    const { data, error: validationError } = parseBannerBody(body);
    if (validationError) {
      log("POST validation failed:", validationError);
      return NextResponse.json({ message: validationError }, { status: 400 });
    }

    if (data.sortOrder === undefined) {
      const last = await db.banner.findFirst({ orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
      data.sortOrder = (last?.sortOrder ?? -1) + 1;
    }
    if (data.isActive === undefined) data.isActive = true;

    const banner = await db.banner.create({ data });
    log("POST created:", banner.id);

    try {
      await logAudit({
        actorId: session.user.id,
        action: "Created",
        entity: "banner",
        entityId: banner.id,
        metadata: { title: banner.title },
      });
    } catch (auditErr) {
      logError("POST logAudit", auditErr);
    }

    return NextResponse.json({ data: banner, message: "Banner created successfully" }, { status: 201 });
  } catch (err) {
    logError("POST", err);
    return NextResponse.json({ message: "Server error: something went wrong" }, { status: 500 });
  }
}

// Bulk delete: body { ids: [] }
export async function DELETE(request) {
  log("DELETE hit");
  const { session, error } = await requireAdmin();
  if (error) {
    log("DELETE blocked by requireAdmin:", error.status);
    return error;
  }

  try {
    const { ids } = await request.json();
    log("DELETE ids:", ids);

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ message: "Select at least one banner" }, { status: 400 });
    }

    const validIds = ids.filter(isValidId);
    const invalid = ids.length - validIds.length;

    const banners = await db.banner.findMany({
      where: { id: { in: validIds } },
      select: { id: true, title: true },
    });

    const result = await db.banner.deleteMany({ where: { id: { in: banners.map((b) => b.id) } } });
    log("DELETE removed:", result.count, "invalid ids:", invalid);

    try {
      await logAudit({
        actorId: session.user.id,
        action: "Deleted",
        entity: "banner",
        entityId: null,
        metadata: { count: result.count, titles: banners.map((b) => b.title) },
      });
    } catch (auditErr) {
      logError("DELETE logAudit", auditErr);
    }

    return NextResponse.json({
      deleted: result.count,
      skipped: invalid + (validIds.length - banners.length),
    });
  } catch (err) {
    logError("DELETE", err);
    return NextResponse.json({ message: "Failed to delete banners" }, { status: 500 });
  }
}