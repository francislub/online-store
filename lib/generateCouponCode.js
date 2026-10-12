// lib/generateCouponCode.js
// Route: n/a (helper used by /dashboard/coupons/new)
export const generateCouponCode = (title = "", expiryDate = "") => {
  const formattedTitle = title.toUpperCase().replace(/[^A-Z0-9]+/g, "");
  const formattedExpiryDate = expiryDate.split("-").reverse().join("");
  return `${formattedTitle}-${formattedExpiryDate}`;
};