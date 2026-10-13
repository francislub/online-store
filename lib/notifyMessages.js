// src/lib/notifyMessages.js
// Pure text builders (no database), safe to import from the browser AND the server.
// Using the same builder on both sides is what stops a customer seeing the same pop-up twice.

const money = (n) => `UGX ${Number(n ?? 0).toLocaleString("en-US")}`;

// staff: "New order GP-1042 from John (0772...): 3 items, UGX 2,450,000"
export function orderMessage(order) {
  const who = order.customer?.name || "a guest customer";
  const items = order.items?.length ?? 0;
  const count = items ? `${items} item${items === 1 ? "" : "s"}, ` : "";
  return `New order ${order.orderNumber} from ${who} (${order.phone}): ${count}${money(order.total)}`;
}

// customer: "Your order GP-1042 has been received. Total UGX 2,450,000."
export function customerOrderMessage(order) {
  return `Your order ${order.orderNumber} has been received. Total ${money(order.total)}.`;
}

// staff: "John Doe (john@mail.com) created a customer account"
export function accountMessage(user) {
  const contact = user.email || user.phone;
  return `${user.name}${contact ? ` (${contact})` : ""} created a customer account`;
}

// customer
export function welcomeMessage(name) {
  return `Welcome ${name}! Your account is ready.`;
}