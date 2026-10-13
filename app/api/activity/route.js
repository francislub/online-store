// app/api/activity/route.js
// Receives customer activity from the browser (cart, wishlist, profile, checkout...)
// and turns it into notifications through recordActivity().
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { recordActivity } from "@/lib/notify";
import { CLIENT_EVENTS, STAFF_MIRRORED } from "@/lib/customerEvents";

const lastSeen = new Map(); // simple anti-spam: same event + message at most once per 3s per user

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user;
    // guests still get the instant pop-up in the browser, nothing is stored for them
    if (!user) return NextResponse.json({ data: null, message: "Guest activity not stored" });

    const { event, message, entityId } = await request.json();
    if (!CLIENT_EVENTS.includes(event)) {
      return NextResponse.json({ data: null, message: "Unknown event" }, { status: 400 });
    }

    const text = String(message ?? "").slice(0, 200);
    const key = `${user.id}:${event}:${text}`;
    const now = Date.now();
    if (now - (lastSeen.get(key) ?? 0) < 3000) return NextResponse.json({ data: null, message: "Duplicate ignored" });
    lastSeen.set(key, now);
    if (lastSeen.size > 5000) lastSeen.clear();

    // 1) the customer's own notification (pops up in their header)
    await recordActivity({
      event,
      actorId: user.id,
      entity: "Customer",
      entityId: entityId ?? user.id,
      message: text || undefined,
      notifyUserIds: [user.id],
      skipActor: false,
    });

    // 2) staff see important customer actions too
    if (STAFF_MIRRORED.includes(event)) {
      await recordActivity({
        event: "CUSTOMER_ACTIVITY",
        actorId: user.id,
        entity: "Customer",
        entityId: user.id,
        message: `${user.name ?? "A customer"}: ${text}`,
      });
    }

    return NextResponse.json({ data: { ok: true }, message: "Recorded" });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ data: null, message: "Server error: something went wrong" }, { status: 500 });
  }
}