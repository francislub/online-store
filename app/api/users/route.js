// app/api/users/route.js
import db from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { getServerSession } from "next-auth";
import { authOptions, STAFF_ROLES, publicUserSelect } from "@/lib/auth";

export async function POST(request) {
  try {
    const { name, email, phone, password, role, adminKey } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { data: null, message: "Name, email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { data: null, message: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const requestedRole = STAFF_ROLES.includes(role) ? role : "CUSTOMER";

    if (requestedRole !== "CUSTOMER") {
      const validKey =
        process.env.ADMIN_REGISTRATION_KEY &&
        adminKey === process.env.ADMIN_REGISTRATION_KEY;
      if (!validKey) {
        return NextResponse.json(
          { data: null, message: "Invalid admin registration key" },
          { status: 403 }
        );
      }
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { data: null, message: "User already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await db.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        phone: phone ? phone.trim() : null,
        passwordHash,
        role: requestedRole,
      },
      select: publicUserSelect,
    });

    return NextResponse.json(
      { data: newUser, message: "User created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { data: null, message: "Server error: something went wrong" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const users = await db.user.findMany({
      orderBy: { createdAt: "desc" },
      select: publicUserSelect,
    });

    return NextResponse.json(users);
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "Failed to fetch users" },
      { status: 500 }
    );
  }
}