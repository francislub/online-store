// app/api/settings/route.js
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DEFAULT_SETTINGS } from "@/lib/activityConfig";
import { recordActivity } from "@/lib/notify";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session) return { error: NextResponse.json({ data: null, message: "Unauthorized" }, { status: 401 }) };
  if (session.user.role !== "ADMIN") return { error: NextResponse.json({ data: null, message: "Forbidden" }, { status: 403 }) };
  return { user: session.user };
}

// GET -> { company: {...}, sales: {...}, inventory: {...}, notifications: {...} } (stored values merged over defaults)
export async function GET() {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const rows = await db.appSetting.findMany();
    const stored = Object.fromEntries(rows.map((r) => [r.key, r.value]));

    const merged = {};
    for (const key of Object.keys(DEFAULT_SETTINGS)) {
      merged[key] = { ...DEFAULT_SETTINGS[key], ...(stored[key] ?? {}) };
    }
    return NextResponse.json(merged);
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Failed to fetch settings" }, { status: 500 });
  }
}

// PUT body: { settings: { company: {...}, sales: {...}, ... } }
export async function PUT(request) {
  try {
    const { error, user } = await requireAdmin();
    if (error) return error;

    const { settings } = await request.json();
    if (!settings || typeof settings !== "object") {
      return NextResponse.json({ data: null, message: "Settings are required" }, { status: 400 });
    }

    const keys = Object.keys(settings).filter((k) => k in DEFAULT_SETTINGS);
    if (keys.length === 0) {
      return NextResponse.json({ data: null, message: "No valid settings sent" }, { status: 400 });
    }

    const sales = settings.sales;
    if (sales) {
      const tax = Number(sales.taxRate);
      if (Number.isNaN(tax) || tax < 0 || tax > 100) {
        return NextResponse.json({ data: null, message: "Tax rate must be between 0 and 100" }, { status: 400 });
      }
    }
    if (settings.company && !String(settings.company.name ?? "").trim()) {
      return NextResponse.json({ data: null, message: "Company name is required" }, { status: 400 });
    }

    for (const key of keys) {
      await db.appSetting.upsert({
        where: { key },
        update: { value: settings[key] },
        create: { key, value: settings[key] },
      });
    }

    await recordActivity({
      event: "SETTINGS_UPDATED",
      actorId: user.id,
      entity: "AppSetting",
      message: `${user.name ?? "Admin"} updated settings: ${keys.join(", ")}`,
      metadata: { keys },
    });

    return NextResponse.json({ data: { keys }, message: "Settings saved" });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ data: null, message: "Server error: something went wrong" }, { status: 500 });
  }
}