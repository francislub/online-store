// app/api/staff/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import db from "@/lib/db";
import { STAFF_ROLES, publicUserSelect } from "@/lib/auth";
import { requireAdmin } from "@/lib/adminGuard";
import { logAudit } from "@/lib/audit";
import { buildStaffWhere, isValidId } from "@/lib/staff";

export async function GET(request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const users = await db.user.findMany({
      where: buildStaffWhere(searchParams.get("q"), searchParams.get("role")),
      orderBy: { createdAt: "desc" },
      select: publicUserSelect,
    });
    return NextResponse.json({ data: users });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ message: "Failed to fetch staff" }, { status: 500 });
  }
}

export async function POST(request) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").toLowerCase().trim();
    const phone = body.phone ? String(body.phone).trim() : null;
    const password = String(body.password || "");
    const role = body.role;
    const isActive = body.isActive !== false;

    if (name.length < 2) {
      return NextResponse.json({ message: "Full name is required" }, { status: 400 });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ message: "A valid email address is required" }, { status: 400 });
    }
    if (!STAFF_ROLES.includes(role)) {
      return NextResponse.json({ message: "Select a valid staff role" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ message: "Password must be at least 8 characters" }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ message: "A user with this email already exists" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await db.user.create({
      data: { name, email, phone, passwordHash, role, isActive },
      select: publicUserSelect,
    });

    await logAudit({
      actorId: session.user.id,
      action: "Created",
      entity: "staff member",
      entityId: user.id,
      metadata: { name: user.name, role: user.role },
    });

    return NextResponse.json({ data: user, message: "Staff created successfully" }, { status: 201 });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ message: "Server error: something went wrong" }, { status: 500 });
  }
}

export async function DELETE(request) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  try {
    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ message: "Select at least one staff member" }, { status: 400 });
    }

    let deleted = 0;
    const skipped = [];

    for (const id of ids) {
      if (!isValidId(id)) {
        skipped.push({ id, name: "Unknown account", reason: "Invalid account id" });
        continue;
      }

      const user = await db.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          role: true,
          _count: {
            select: {
              orders: true,
              payments: true,
              recordedPayments: true,
              expenses: true,
              auditLogs: true,
              quotes: true,
              createdQuotes: true,
              stockMovements: true,
            },
          },
        },
      });

      if (!user || !STAFF_ROLES.includes(user.role)) {
        skipped.push({ id, name: user?.name || "Unknown account", reason: "Staff account not found" });
        continue;
      }

      if (user.id === session.user.id) {
        skipped.push({ id, name: user.name, reason: "You cannot delete your own account" });
        continue;
      }

      const history = Object.values(user._count).reduce((sum, count) => sum + count, 0);
      if (history > 0) {
        skipped.push({
          id,
          name: user.name,
          reason: "Has recorded activity, deactivate the account instead",
        });
        continue;
      }

      if (user.role === "ADMIN") {
        const otherAdmins = await db.user.count({
          where: { role: "ADMIN", isActive: true, id: { not: id } },
        });
        if (otherAdmins === 0) {
          skipped.push({ id, name: user.name, reason: "Cannot delete the last active administrator" });
          continue;
        }
      }

      await db.adminSession.deleteMany({ where: { userId: id } });
      await db.notification.deleteMany({ where: { userId: id } });
      await db.address.deleteMany({ where: { userId: id } });
      await db.user.delete({ where: { id } });

      await logAudit({
        actorId: session.user.id,
        action: "Deleted",
        entity: "staff member",
        entityId: id,
        metadata: { name: user.name, role: user.role },
      });

      deleted += 1;
    }

    return NextResponse.json({ deleted, skipped });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ message: "Failed to delete staff" }, { status: 500 });
  }
}