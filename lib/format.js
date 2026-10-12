// lib/format.js
const TIME_ZONE = "Africa/Kampala";

export function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-US");
}

export function formatUGX(value) {
  const amount = Math.round(Number(value || 0));
  return `${amount < 0 ? "-" : ""}UGX ${Math.abs(amount).toLocaleString("en-US")}`;
}

export function formatCompact(value) {
  const amount = Number(value || 0);
  if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1)}B`;
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
  return String(Math.round(amount));
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString("en-GB", {
    timeZone: TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date) {
  return new Date(date).toLocaleString("en-GB", {
    timeZone: TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const money = (value) => `UGX ${Number(value ?? 0).toLocaleString()}`;

export const fmtDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-";

export const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : "");