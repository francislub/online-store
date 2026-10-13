// app/api/storefront/auth/me/route.js
// GET /api/storefront/auth/me -> { data: customer | null }
import { NextResponse } from "next/server";
import { getCustomer, publicCustomer } from "@/lib/customerAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ data: publicCustomer(await getCustomer()) });
  } catch {
    return NextResponse.json({ data: null });
  }
}