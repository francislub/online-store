// app/api/storefront/home/route.js
// Route: /api/storefront/home  (GET, public)
import { NextResponse } from "next/server";
import { getHomeData } from "@/lib/storefront";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TAG = "[api/storefront/home]";

export async function GET() {
  try {
    const data = await getHomeData();
    return NextResponse.json({ data });
  } catch (err) {
    console.error(`${TAG} ERROR:`, err?.code || "", err?.message || err);
    return NextResponse.json({ message: "Failed to load home page data" }, { status: 500 });
  }
}