// Route: /api/storefront/settings
// Methods: GET (?key=home.accessoriesBanner)

import { NextResponse } from "next/server";
import db from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    // Only allow public home settings.
    if (!key || !key.startsWith("home.")) {
      return NextResponse.json(
        { message: "Invalid key" },
        { status: 400 }
      );
    }

    // The home configuration is stored under a single database key.
    const row = await db.appSetting.findUnique({
      where: { key: "home-sections" },
    });

    const config = row?.value;

    // Convert home.accessoriesBanner into accessoriesBanner.
    const settingName = key.slice("home.".length);

    // Return null when the setting does not exist.
    const value =
      config &&
      typeof config === "object" &&
      !Array.isArray(config) &&
      Object.prototype.hasOwnProperty.call(config, settingName)
        ? config[settingName]
        : null;

    return NextResponse.json({ key, value });
  } catch (error) {
    console.error("Storefront settings API error:", error);

    return NextResponse.json(
      { message: "Failed to fetch setting" },
      { status: 500 }
    );
  }
}