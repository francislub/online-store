// app/api/storefront/auth/login/route.js
// POST /api/storefront/auth/login { email, password }
import db from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { createSession, jsonError, publicCustomer } from "@/lib/customerAuth";

export const runtime = "nodejs";

// compared against when the user doesn't exist, so response time doesn't reveal valid emails
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

export async function POST(request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").toLowerCase().trim();
    const password = String(body.password ?? "");
    if (!email || !password) return jsonError("Email and password are required");

    const user = await db.user.findUnique({ where: { email } });
    const ok = await bcrypt.compare(password, user?.passwordHash || DUMMY_HASH);

    if (!user || !user.passwordHash || !ok || user.role !== "CUSTOMER") {
      return jsonError("Invalid email or password", 401);
    }
    if (!user.isActive) return jsonError("This account is disabled. Please contact us.", 403);

    await createSession(user.id);
    return NextResponse.json({ data: publicCustomer(user), message: "Welcome back" });
  } catch (err) {
    console.error("[auth/login]", err);
    return jsonError("Server error: something went wrong", 500);
  }
}