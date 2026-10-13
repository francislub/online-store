// app/api/storefront/auth/logout/route.js
// POST /api/storefront/auth/logout
import { NextResponse } from "next/server";
import { destroySession } from "@/lib/customerAuth";

export const runtime = "nodejs";

export async function POST() {
  await destroySession();
  return NextResponse.json({ message: "Logged out" });
}