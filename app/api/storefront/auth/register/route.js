// app/api/storefront/auth/register/route.js
// POST /api/storefront/auth/register { name, email, phone?, password }
import db from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { createSession, jsonError, publicCustomer } from "@/lib/customerAuth";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").toLowerCase().trim();
    const phone = body.phone ? String(body.phone).trim() : null;
    const password = String(body.password ?? "");

    if (!name) return jsonError("Full name is required");
    if (!/^\S+@\S+\.\S+$/.test(email)) return jsonError("Enter a valid email address");
    if (password.length < 8) return jsonError("Password must be at least 8 characters");

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) return jsonError("An account with this email already exists. Please log in.", 409, "EMAIL_EXISTS");

    const user = await db.user.create({
      data: { name, email, phone, role: "CUSTOMER", passwordHash: await bcrypt.hash(password, 10) },
    });

    await createSession(user.id);
    return NextResponse.json({ data: publicCustomer(user), message: "Account created" }, { status: 201 });
  } catch (err) {
    console.error("[auth/register]", err);
    return jsonError("Server error: something went wrong", 500);
  }
}