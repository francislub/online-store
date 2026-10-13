// src/lib/withActivity.js
// Wraps an API route handler so a notification is raised automatically after a SUCCESSFUL response.
// This is the easiest way to make "every activity in the system" notify, without editing the handler body.
//
//   import { withActivity } from "@/lib/withActivity";
//
//   async function createOrder(request) { ... return NextResponse.json({ data: order }, { status: 201 }); }
//
//   export const POST = withActivity(createOrder, ({ body, user }) => ({
//     event: "ORDER_CREATED",
//     entity: "Order",
//     entityId: body.data.id,
//     message: `New order ${body.data.number} (UGX ${Number(body.data.total).toLocaleString()})`,
//     notifyUserIds: [body.data.userId],          // optional: also tell the customer
//   }));
//
// `describe` may return one object, an array of objects, or null to skip. It receives:
//   { request, context, body (the JSON the handler returned), user (the signed-in user) }
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { recordActivity } from "@/lib/notify";

export function withActivity(handler, describe) {
  return async function wrapped(request, context) {
    const response = await handler(request, context);

    try {
      if (response && response.status >= 200 && response.status < 300) {
        const session = await getServerSession(authOptions);
        const user = session?.user ?? null;
        const body = await response.clone().json().catch(() => null);

        const info = typeof describe === "function" ? await describe({ request, context, body, user }) : describe;
        const list = Array.isArray(info) ? info : info ? [info] : [];

        for (const activity of list) {
          // skipActor:false so the person who did it also sees the pop-up
          await recordActivity({ actorId: user?.id ?? null, skipActor: false, ...activity });
        }
      }
    } catch (error) {
      console.log("[withActivity] failed", error); // never break the real request
    }

    return response;
  };
}