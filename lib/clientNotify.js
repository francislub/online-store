// src/lib/clientNotify.js
// Call from any client component when the customer does something on the website.
// 1) pops up in the header instantly, 2) saves it as a real notification (if signed in).
//
//   notifyClient("CART_ITEM_ADDED", `${product.name} added to your cart`);
import { CUSTOMER_EVENTS } from "@/lib/customerEvents";

export function notifyClient(event, message, { entityId, track = true } = {}) {
  if (typeof window === "undefined" || !message) return;
  const cfg = CUSTOMER_EVENTS[event];

  window.dispatchEvent(
    new CustomEvent("app:notify", {
      detail: { title: cfg?.title ?? "Activity", message, type: cfg?.category },
    })
  );

  if (!track) return;
  fetch("/api/activity", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, message, entityId }),
    keepalive: true,
  })
    .then(() => window.dispatchEvent(new Event("app:notify-refresh")))
    .catch(() => {});
}