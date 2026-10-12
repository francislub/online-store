// app/api/staff/[id]/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import db from "@/lib/db";
import { STAFF_ROLES, publicUserSelect } from "@/lib/auth";
import { requireAdmin } from "@/lib/adminGuard";
import { logAudit } from "@/lib/audit";
import { isValidId } from "@/lib/staff";

export async function GET(request, { params }) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;

    if (!isValidId(id)) {
      return NextResponse.json({ message: "Staff member not found" }, { status: 404 });
    }

    const user = await db.user.findUnique({ where: { id }, select: publicUserSelect });

    if (!user || !STAFF_ROLES.includes(user.role)) {
      return NextResponse.json({ message: "Staff member not found" }, { status: 404 });
    }

    return NextResponse.json({ data: user });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ message: "Failed to fetch staff member" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;

    if (!isValidId(id)) {
      return NextResponse.json({ message: "Staff member not found" }, { status: 404 });
    }

    const existing = await db.user.findUnique({ where: { id }, select: publicUserSelect });

    if (!existing || !STAFF_ROLES.includes(existing.role)) {
      return NextResponse.json({ message: "Staff member not found" }, { status: 404 });
    }

    const body = await request.json();
    const data = {};

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (name.length < 2) {
        return NextResponse.json({ message: "Full name is required" }, { status: 400 });
      }
      data.name = name;
    }

    if (body.email !== undefined) {
      const email = String(body.email).toLowerCase().trim();
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        return NextResponse.json({ message: "A valid email address is required" }, { status: 400 });
      }
      if (email !== existing.email) {
        const taken = await db.user.findUnique({ where: { email } });
        if (taken) {
          return NextResponse.json({ message: "A user with this email already exists" }, { status: 409 });
        }
        data.email = email;
      }
    }

    if (body.phone !== undefined) {
      data.phone = body.phone ? String(body.phone).trim() : null;
    }

    if (body.role !== undefined) {
      if (!STAFF_ROLES.includes(body.role)) {
        return NextResponse.json({ message: "Select a valid staff role" }, { status: 400 });
      }
      data.role = body.role;
    }

    if (body.isActive !== undefined) {
      data.isActive = Boolean(body.isActive);
    }

    if (body.password) {
      if (String(body.password).length < 8) {
        return NextResponse.json({ message: "Password must be at least 8 characters" }, { status: 400 });
      }
      data.passwordHash = await bcrypt.hash(String(body.password), 10);
    }

    const nextRole = data.role ?? existing.role;
    const nextActive = data.isActive ?? existing.isActive;

    if (id === session.user.id && (nextRole !== existing.role || nextActive === false)) {
      return NextResponse.json(
        { message: "You cannot change your own role or deactivate your own account" },
        { status: 400 }
      );
    }

    if (existing.role === "ADMIN" && (nextRole !== "ADMIN" || !nextActive)) {
      const otherAdmins = await db.user.count({
        where: { role: "ADMIN", isActive: true, id: { not: id } },
      });
      if (otherAdmins === 0) {
        return NextResponse.json(
          { message: "At least one active administrator must remain" },
          { status: 400 }
        );
      }
    }

    const user = await db.user.update({
      where: { id },
      data,
      select: publicUserSelect,
    });

    await logAudit({
      actorId: session.user.id,
      action: "Updated",
      entity: "staff member",
      entityId: id,
      metadata: { name: user.name, role: user.role, isActive: user.isActive },
    });

    return NextResponse.json({ data: user, message: "Staff updated successfully" });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ message: "Server error: something went wrong" }, { status: 500 });
  }
}