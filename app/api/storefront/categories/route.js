// app/api/storefront/categories/route.js
// Route: /api/storefront/categories  (GET, public) -> active category tree with product counts
import { NextResponse } from "next/server";
import { loadCategoryIndex } from "@/lib/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { tree } = await loadCategoryIndex();
    return NextResponse.json({ data: tree });
  } catch (err) {
    console.error("[api/storefront/categories] ERROR:", err?.code || "", err?.message || err);
    return NextResponse.json({ message: "Failed to load categories" }, { status: 500 });
  }
}