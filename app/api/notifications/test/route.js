// app/api/notifications/test/route.js
// POST { type: "ORDER" }  -> creates one notification for the signed-in user.
// Use the "Send test" button in the inbox dropdown: if the pop-up, the badge and the
// Orders sidebar button all light up, the display side is working.
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CATEGORIES } from "@/lib/activityConfig";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user;
    if (!user) return NextResponse.json({ data: null, message: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const type = CATEGORIES[body?.type] ? body.type : "SYSTEM";
    const label = CATEGORIES[type].label;
    const time = new Date().toLocaleTimeString("en-GB", { timeZone: "Africa/Kampala" });

    const row = await db.notification.create({
      data: {
        userId: user.id,
        type,
        title: `Test: ${label}`,
        message: `Test ${label.toLowerCase()} message sent at ${time}. If you can read this, notifications work.`,
      },
    });
    return NextResponse.json({ data: row, message: "Test notification created" });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ data: null, message: "Server error: something went wrong" }, { status: 500 });
  }
}