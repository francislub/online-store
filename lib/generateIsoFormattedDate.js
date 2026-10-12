// lib/generateIsoFormattedDate.js
// Route: n/a (helper used by coupon forms)
export function generateIsoFormattedDate(normalDate) {
  return new Date(normalDate).toISOString();
}

// ISO string -> "yyyy-mm-dd" for <input type="date" />
export function toDateInputValue(isoDate) {
  if (!isoDate) return "";
  return new Date(isoDate).toISOString().split("T")[0];
}