// lib/customerAuth.js
// Route: n/a. Cookie-session helpers for storefront customers (stored in AdminSession, token hashed).
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import crypto from "crypto";
import db from "@/lib/db";

export const COOKIE = "cs_token";
const DAYS = 30;

const hashToken = (t) => crypto.createHash("sha256").update(t).digest("hex");

export const jsonError = (message, status = 400, code) =>
  NextResponse.json({ message, ...(code ? { code } : {}) }, { status });

export const isPlaceholderEmail = (email) => !email || email.endsWith("@walkin.local");

export const publicCustomer = (u) =>
  u
    ? {
        id: u.id,
        name: u.name,
        email: isPlaceholderEmail(u.email) ? "" : u.email,
        phone: u.phone || "",
        createdAt: u.createdAt,
      }
    : null;

export async function createSession(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + DAYS * 24 * 60 * 60 * 1000);
  await db.adminSession.create({ data: { token: hashToken(token), userId, expiresAt } });

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function getCustomer() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;

  const session = await db.adminSession.findUnique({
    where: { token: hashToken(token) },
    include: { user: true },
  });
  if (!session) return null;

  if (session.expiresAt < new Date()) {
    await db.adminSession.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  const u = session.user;
  if (!u || !u.isActive || u.role !== "CUSTOMER") return null;
  return u;
}

export async function requireCustomer() {
  const customer = await getCustomer();
  if (!customer) return { error: jsonError("Please log in to continue", 401, "UNAUTHENTICATED") };
  return { customer };
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.adminSession.deleteMany({ where: { token: hashToken(token) } });
  jar.delete(COOKIE);
}