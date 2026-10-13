// app/api/settings/home/route.js
// Route: /api/settings/home  (GET, PUT — admin only)
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/adminGuard";
import { logAudit } from "@/lib/audit";
import { HOME_SETTING_KEY, getHomeConfig } from "@/lib/storefront";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TAG = "[api/settings/home]";
const logError = (step, err) =>
  console.error(`${TAG} ERROR at "${step}":`, err?.code || "", err?.message || err);

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    return NextResponse.json({ data: await getHomeConfig() });
  } catch (err) {
    logError("GET", err);
    return NextResponse.json({ message: "Failed to load settings" }, { status: 500 });
  }
}

// Body: any part of the config, e.g. { laptopPromo: {...}, monitors: { categorySlug: "monitors" } }
export async function PUT(request) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ message: "Body must be an object" }, { status: 400 });
    }

    const existing = await db.appSetting.findUnique({ where: { key: HOME_SETTING_KEY } });
    const current = existing?.value && typeof existing.value === "object" ? existing.value : {};
    const value = { ...current, ...body };

    const saved = await db.appSetting.upsert({
      where: { key: HOME_SETTING_KEY },
      create: { key: HOME_SETTING_KEY, value },
      update: { value },
    });

    try {
      await logAudit({
        actorId: session.user.id,
        action: "Updated",
        entity: "home-settings",
        entityId: saved.id,
        metadata: { keys: Object.keys(body) },
      });
    } catch (auditErr) {
      logError("PUT logAudit", auditErr);
    }

    return NextResponse.json({ data: saved.value, message: "Home settings saved" });
  } catch (err) {
    logError("PUT", err);
    return NextResponse.json({ message: "Server error: something went wrong" }, { status: 500 });
  }
}