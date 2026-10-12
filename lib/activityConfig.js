// lib/activityConfig.js
// Route: n/a (pure config shared by the server helper and the dashboard pages)
// Every system activity is declared here once: which category it belongs to,
// the notification title, and which staff roles are notified.

export const CATEGORIES = {
  ORDER: { label: "Orders", href: "/dashboard/orders" },
  PAYMENT: { label: "Payments", href: "/dashboard/payments" },
  INVOICE: { label: "Invoices", href: "/dashboard/invoices" },
  QUOTE: { label: "Quotes", href: "/dashboard/quotes" },
  RETURN: { label: "Returns", href: "/dashboard/returns" },
  PURCHASE: { label: "Purchases & suppliers", href: "/dashboard/purchases" },
  STOCK: { label: "Stock", href: "/dashboard/stock" },
  EXPENSE: { label: "Expenses", href: "/dashboard/expenses" },
  CATALOG: { label: "Products & categories", href: "/dashboard/products" },
  MARKETING: { label: "Coupons & banners", href: "/dashboard/coupons" },
  USER: { label: "Users", href: "/dashboard/users" },
  SYSTEM: { label: "System & settings", href: "/dashboard/settings" },
};

const STAFF = ["ADMIN", "SALES", "CASHIER", "STOREKEEPER"];
const ev = (category, title, roles) => ({ category, title, roles });

export const EVENTS = {
  // Orders
  ORDER_CREATED: ev("ORDER", "New order placed", STAFF),
  ORDER_STATUS_CHANGED: ev("ORDER", "Order status updated", ["ADMIN", "SALES", "STOREKEEPER"]),
  ORDER_CANCELLED: ev("ORDER", "Order cancelled", ["ADMIN", "SALES", "STOREKEEPER"]),
  // Payments
  PAYMENT_RECORDED: ev("PAYMENT", "Payment recorded", ["ADMIN", "CASHIER", "SALES"]),
  PAYMENT_REFUNDED: ev("PAYMENT", "Payment refunded", ["ADMIN", "CASHIER"]),
  // Invoices
  INVOICE_ISSUED: ev("INVOICE", "Invoice issued", ["ADMIN", "CASHIER", "SALES"]),
  INVOICE_PAID: ev("INVOICE", "Invoice fully paid", ["ADMIN", "CASHIER"]),
  INVOICE_OVERDUE: ev("INVOICE", "Invoice overdue", ["ADMIN", "CASHIER", "SALES"]),
  INVOICE_VOIDED: ev("INVOICE", "Invoice voided", ["ADMIN", "CASHIER"]),
  // Quotes
  QUOTE_CREATED: ev("QUOTE", "New quote created", ["ADMIN", "SALES"]),
  QUOTE_STATUS_CHANGED: ev("QUOTE", "Quote status updated", ["ADMIN", "SALES"]),
  // Returns
  RETURN_REQUESTED: ev("RETURN", "Return requested", ["ADMIN", "SALES", "STOREKEEPER"]),
  RETURN_STATUS_CHANGED: ev("RETURN", "Return status updated", ["ADMIN", "SALES", "STOREKEEPER"]),
  // Purchasing
  PURCHASE_CREATED: ev("PURCHASE", "Purchase order created", ["ADMIN", "STOREKEEPER"]),
  PURCHASE_RECEIVED: ev("PURCHASE", "Purchase received into stock", ["ADMIN", "STOREKEEPER"]),
  PURCHASE_CANCELLED: ev("PURCHASE", "Purchase cancelled", ["ADMIN", "STOREKEEPER"]),
  SUPPLIER_CREATED: ev("PURCHASE", "Supplier added", ["ADMIN", "STOREKEEPER"]),
  SUPPLIER_UPDATED: ev("PURCHASE", "Supplier updated", ["ADMIN"]),
  SUPPLIER_DELETED: ev("PURCHASE", "Supplier deleted", ["ADMIN"]),
  // Stock
  STOCK_ADJUSTED: ev("STOCK", "Stock adjusted", ["ADMIN", "STOREKEEPER"]),
  LOW_STOCK: ev("STOCK", "Low stock alert", ["ADMIN", "STOREKEEPER"]),
  OUT_OF_STOCK: ev("STOCK", "Out of stock alert", ["ADMIN", "STOREKEEPER", "SALES"]),
  // Expenses
  EXPENSE_RECORDED: ev("EXPENSE", "Expense recorded", ["ADMIN"]),
  EXPENSE_DELETED: ev("EXPENSE", "Expense deleted", ["ADMIN"]),
  // Catalog
  PRODUCT_CREATED: ev("CATALOG", "Product created", ["ADMIN", "STOREKEEPER"]),
  PRODUCT_UPDATED: ev("CATALOG", "Product updated", ["ADMIN", "STOREKEEPER"]),
  PRODUCT_DELETED: ev("CATALOG", "Product deleted", ["ADMIN", "STOREKEEPER"]),
  CATEGORY_CREATED: ev("CATALOG", "Category created", ["ADMIN"]),
  CATEGORY_UPDATED: ev("CATALOG", "Category updated", ["ADMIN"]),
  CATEGORY_DELETED: ev("CATALOG", "Category deleted", ["ADMIN"]),
  // Marketing
  COUPON_CREATED: ev("MARKETING", "Coupon created", ["ADMIN", "SALES"]),
  COUPON_UPDATED: ev("MARKETING", "Coupon updated", ["ADMIN", "SALES"]),
  COUPON_DELETED: ev("MARKETING", "Coupon deleted", ["ADMIN", "SALES"]),
  BANNER_CREATED: ev("MARKETING", "Banner created", ["ADMIN"]),
  BANNER_UPDATED: ev("MARKETING", "Banner updated", ["ADMIN"]),
  BANNER_DELETED: ev("MARKETING", "Banner deleted", ["ADMIN"]),
  // Users
  USER_REGISTERED: ev("USER", "New user registered", ["ADMIN"]),
  USER_UPDATED: ev("USER", "User updated", ["ADMIN"]),
  USER_ROLE_CHANGED: ev("USER", "User role changed", ["ADMIN"]),
  USER_DEACTIVATED: ev("USER", "User deactivated", ["ADMIN"]),
  USER_DELETED: ev("USER", "User deleted", ["ADMIN"]),
  // System
  SETTINGS_UPDATED: ev("SYSTEM", "Settings updated", ["ADMIN"]),
  REPORT_GENERATED: ev("SYSTEM", "Report generated", ["ADMIN"]),
};

export const DEFAULT_SETTINGS = {
  company: {
    name: "GREEN PLANET COMPUTERS",
    location: "Kampala Plaza Next E-Tower Kampala Road, Shop No. B8",
    phone: "0789 033 647 | 0701 055 646",
    email: "",
    tin: "",
  },
  sales: {
    currency: "UGX",
    taxRate: 0,
    invoiceDueDays: 7,
    quoteValidDays: 14,
  },
  inventory: {
    defaultReorderLevel: 5,
  },
  notifications: {
    disabled: [], // category keys that should NOT create notifications
  },
};