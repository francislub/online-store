// lib/adminGuard.js
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

export async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return { error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
  }

  if (session.user.role !== "ADMIN") {
    return {
      error: NextResponse.json(
        { message: "Only administrators can manage staff" },
        { status: 403 }
      ),
    };
  }

  return { session };
}