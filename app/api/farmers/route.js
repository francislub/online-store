// Route: /api/farmers
// Methods: GET, POST

import { NextResponse } from "next/server";
import db from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/farmers
// Create a new farmer profile.
export async function POST(request) {
  try {
    const farmerData = await request.json();

    if (!farmerData || typeof farmerData !== "object" || Array.isArray(farmerData)) {
      return NextResponse.json(
        { message: "Invalid farmer data provided" },
        { status: 400 }
      );
    }

    const landSize =
      farmerData.landSize === "" ||
      farmerData.landSize === null ||
      farmerData.landSize === undefined
        ? null
        : Number(farmerData.landSize);

    if (
      landSize !== null &&
      (!Number.isFinite(landSize) || landSize < 0)
    ) {
      return NextResponse.json(
        { message: "Land size must be a valid non-negative number" },
        { status: 400 }
      );
    }

    const newFarmerProfile = await db.farmerProfile.create({
      data: {
        code: farmerData.code,
        contactPerson: farmerData.contactPerson,
        contactPersonPhone: farmerData.contactPersonPhone,
        email: farmerData.email,
        name: farmerData.name,
        notes: farmerData.notes,
        phone: farmerData.phone,
        physicalAddress: farmerData.physicalAddress,
        terms: farmerData.terms,
        isActive: farmerData.isActive,
        profileImageUrl: farmerData.profileImageUrl,
        products: farmerData.products,
        landSize,
        mainCrop: farmerData.mainCrop,
        userId: farmerData.userId,
      },
    });

    return NextResponse.json(newFarmerProfile, {
      status: 201,
    });
  } catch (error) {
    console.error("[api/farmers] Failed to create farmer:", error);

    return NextResponse.json(
      { message: "Failed to create farmer" },
      { status: 500 }
    );
  }
}

// GET /api/farmers
// Fetch all farmer profiles, newest first.
export async function GET() {
  try {
    const profiles = await db.farmerProfile.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(profiles);
  } catch (error) {
    console.error("[api/farmers] Failed to fetch profiles:", error);

    return NextResponse.json(
      { message: "Failed to fetch farmer profiles" },
      { status: 500 }
    );
  }
}