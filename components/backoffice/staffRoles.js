// components/backoffice/staffRoles.js
export const STAFF_ROLE_OPTIONS = [
  { value: "ADMIN", label: "Administrator", tone: "purple", description: "Full access to every part of the system." },
  { value: "CASHIER", label: "Cashier", tone: "green", description: "Handles payments, invoices, expenses and returns." },
  { value: "SALES", label: "Sales", tone: "blue", description: "Manages quotes, customers, coupons and orders." },
  { value: "STOREKEEPER", label: "Storekeeper", tone: "orange", description: "Manages products, stock, suppliers and purchases." },
];

export const STAFF_ROLE_MAP = Object.fromEntries(
  STAFF_ROLE_OPTIONS.map((option) => [option.value, option])
);