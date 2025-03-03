import { NextResponse } from "next/server";
import db from "@/lib/db";

// Ensure you export a properly named GET function
export async function GET(request, { params }) {
    try {
        // Extract `id` correctly
        const { id } = params;

        if (!id) {
            return NextResponse.json(
                { message: "User ID is required" },
                { status: 400 }
            );
        }

        const user = await db.user.findUnique({
            where: { id }
        });

        if (!user) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error("Error fetching user:", error);
        return NextResponse.json(
            { message: "Failed to fetch user", error: error.message },
            { status: 500 }
        );
    }
}
