// lib/paymentOptions.js
// Route: n/a (shared by checkout UI and order API; no database imports)
export const PAYMENT_OPTIONS = {
  cod: { label: "Pay on delivery", method: "CASH", hint: "Pay in cash when your order arrives." },
  mtn: { label: "MTN Mobile Money", method: "MOBILE_MONEY", hint: "We email you payment instructions after you order." },
  airtel: { label: "Airtel Money", method: "MOBILE_MONEY", hint: "We email you payment instructions after you order." },
  bank: { label: "Bank Transfer", method: "BANK_TRANSFER", hint: "We email you our bank details after you order." },
};