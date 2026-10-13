// src/lib/customerEvents.js
// Website / customer activity. Merged into activityConfig.js (see INTEGRATION.md).
// roles: [] means "only the people passed in notifyUserIds" (i.e. the customer).
// Do NOT import activityConfig here (it imports this file).

const ev = (category, title, roles = []) => ({ category, title, roles });

export const CUSTOMER_CATEGORIES = {
  ACCOUNT: { label: "Customer accounts", href: "/dashboard/users" },
  SHOPPING: { label: "Customer shopping", href: "/dashboard/orders" },
};

export const CUSTOMER_EVENTS = {
  // ---- shown to the customer in the website header ----
  CUSTOMER_WELCOME: ev("ACCOUNT", "Welcome!"),
  CUSTOMER_LOGIN: ev("ACCOUNT", "Signed in"),
  PROFILE_UPDATED: ev("ACCOUNT", "Profile updated"),
  PASSWORD_CHANGED: ev("ACCOUNT", "Password changed"),
  ADDRESS_ADDED: ev("ACCOUNT", "Address added"),
  ADDRESS_UPDATED: ev("ACCOUNT", "Address updated"),
  ADDRESS_DELETED: ev("ACCOUNT", "Address removed"),
  CART_ITEM_ADDED: ev("SHOPPING", "Added to cart"),
  CART_ITEM_REMOVED: ev("SHOPPING", "Removed from cart"),
  WISHLIST_ADDED: ev("SHOPPING", "Added to wishlist"),
  COUPON_APPLIED: ev("SHOPPING", "Coupon applied"),
  CHECKOUT_STARTED: ev("SHOPPING", "Checkout started"),
  CUSTOMER_ORDER_PLACED: ev("ORDER", "Order placed"),
  CUSTOMER_ORDER_STATUS: ev("ORDER", "Order update"),
  CUSTOMER_PAYMENT_RECEIVED: ev("PAYMENT", "Payment received"),
  CUSTOMER_INVOICE_ISSUED: ev("INVOICE", "Invoice ready"),
  CUSTOMER_RETURN_UPDATE: ev("RETURN", "Return update"),

  // ---- mirrored to staff so they see what customers do ----
  CUSTOMER_ACTIVITY: ev("SHOPPING", "Customer activity", ["ADMIN", "SALES"]),
};

// events the browser is allowed to report through POST /api/activity
export const CLIENT_EVENTS = [
  "CUSTOMER_LOGIN",
  "PROFILE_UPDATED",
  "PASSWORD_CHANGED",
  "ADDRESS_ADDED",
  "ADDRESS_UPDATED",
  "ADDRESS_DELETED",
  "CART_ITEM_ADDED",
  "CART_ITEM_REMOVED",
  "WISHLIST_ADDED",
  "COUPON_APPLIED",
  "CHECKOUT_STARTED",
];

// which client events staff also get told about
export const STAFF_MIRRORED = ["CHECKOUT_STARTED", "COUPON_APPLIED"];

// where a customer is sent when they click a notification
export const CUSTOMER_HREFS = {
  ORDER: "/account?tab=orders",
  PAYMENT: "/account?tab=orders",
  INVOICE: "/account?tab=orders",
  RETURN: "/account?tab=orders",
  ACCOUNT: "/account",
  SHOPPING: "/cart",
};