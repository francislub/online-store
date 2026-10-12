// lib/constants.js
// Route: n/a (shared constants, safe to import from client AND server code)

export const ORDER_STATUSES = ["PENDING", "PROCESSING", "SHIPPED", "COMPLETED", "CANCELLED"];

// Allowed order workflow: where an order can go next from its current status
export const ORDER_TRANSITIONS = {
  PENDING: ["PROCESSING", "SHIPPED", "COMPLETED", "CANCELLED"],
  PROCESSING: ["SHIPPED", "COMPLETED", "CANCELLED"],
  SHIPPED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export const QUOTE_STATUSES = ["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED", "CONVERTED"];

export const PAYMENT_METHODS = ["CASH", "BANK_TRANSFER", "MOBILE_MONEY", "CREDIT", "CARD"];
export const PAYMENT_STATUSES = ["PENDING", "PARTIAL", "PAID", "REFUNDED"];

// Only these payment statuses count towards what a customer has actually paid
export const COUNTED_PAYMENT_STATUSES = ["PAID", "PARTIAL"];

export const prettify = (value) => String(value ?? "").replace(/_/g, " ").toLowerCase();
