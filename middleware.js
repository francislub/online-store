// middleware.js
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const STAFF_ROLES = ["ADMIN", "CASHIER", "SALES", "STOREKEEPER"];

export async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const url = new URL("/admin/login", req.url);
    url.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (!STAFF_ROLES.includes(token.role)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};