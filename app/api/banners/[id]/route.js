// app/api/banners/[id]/route.js
// Route: /api/banners/:id  (GET, PUT, DELETE)
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/adminGuard";
import { logAudit } from "@/lib/audit";
import { isValidId, parseBannerBody } from "@/lib/banners";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TAG = "[api/banners/:id]";
const log = (...a) => console.log(TAG, ...a);
const logError = (step, err) =>
  console.error(`${TAG} ERROR at "${step}":`, err?.code || "", err?.message || err, err?.meta || "");

const notFound = () => NextResponse.json({ message: "Banner not found" }, { status: 404 });

export async function GET(request, { params }) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    log("GET id:", id);
    if (!isValidId(id)) return notFound();

    const banner = await db.banner.findUnique({ where: { id } });
    if (!banner) return notFound();

    return NextResponse.json({ data: banner });
  } catch (err) {
    logError("GET", err);
    return NextResponse.json({ message: "Failed to fetch banner" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    log("PUT id:", id);
    if (!isValidId(id)) return notFound();

    const existing = await db.banner.findUnique({ where: { id } });
    if (!existing) return notFound();

    let body;
    try {
      body = await request.json();
    } catch (err) {
      return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
    }
    log("PUT body:", body);

    const { data, error: validationError } = parseBannerBody(body, { partial: true });
    if (validationError) {
      log("PUT validation failed:", validationError);
      return NextResponse.json({ message: validationError }, { status: 400 });
    }

    const banner = await db.banner.update({ where: { id }, data });
    log("PUT updated:", banner.id);

    try {
      await logAudit({
        actorId: session.user.id,
        action: "Updated",
        entity: "banner",
        entityId: id,
        metadata: { title: banner.title, isActive: banner.isActive },
      });
    } catch (auditErr) {
      logError("PUT logAudit", auditErr);
    }

    return NextResponse.json({ data: banner, message: "Banner updated successfully" });
  } catch (err) {
    logError("PUT", err);
    return NextResponse.json({ message: "Server error: something went wrong" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    log("DELETE id:", id);
    if (!isValidId(id)) return notFound();

    const existing = await db.banner.findUnique({ where: { id } });
    if (!existing) return notFound();

    await db.banner.delete({ where: { id } });
    log("DELETE removed:", id);

    try {
      await logAudit({
        actorId: session.user.id,
        action: "Deleted",
        entity: "banner",
        entityId: id,
        metadata: { title: existing.title },
      });
    } catch (auditErr) {
      logError("DELETE logAudit", auditErr);
    }

    return NextResponse.json({ message: "Banner deleted successfully" });
  } catch (err) {
    logError("DELETE", err);
    return NextResponse.json({ message: "Failed to delete banner" }, { status: 500 });
  }
}