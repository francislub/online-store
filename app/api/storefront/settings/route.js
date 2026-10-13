// Route: /api/storefront/settings
// Methods: GET (?key=home.accessoriesBanner)
// File: src/app/api/storefront/settings/route.js
import { NextResponse } from "next/server";
import { getSetting } from "@/lib/storefront";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const key = new URL(request.url).searchParams.get("key");

    // Only "home.*" keys are public, so other AppSetting rows are never exposed
    if (!key || !key.startsWith("home.")) {
      return NextResponse.json({ message: "Invalid key" }, { status: 400 });
    }

    return NextResponse.json({ key, value: await getSetting(key, null) });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Failed to fetch setting", error: String(error) }, { status: 500 });
  }
}