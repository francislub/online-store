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

export const RETURN_STATUSES = ["REQUESTED", "APPROVED", "RECEIVED", "REFUNDED", "REPLACED", "REJECTED"];

// Return workflow: where a return can go next
export const RETURN_TRANSITIONS = {
  REQUESTED: ["APPROVED", "REJECTED"],
  APPROVED: ["RECEIVED", "REJECTED"],
  RECEIVED: ["REFUNDED", "REPLACED"],
  REFUNDED: [],
  REPLACED: [],
  REJECTED: [],
};

// Only orders that actually left the shop can have items returned
export const RETURNABLE_ORDER_STATUSES = ["SHIPPED", "COMPLETED"];

export const RETURN_REASONS = ["Defective / not working", "Wrong item delivered", "Damaged in transit", "Not as described", "Changed mind", "Other"];