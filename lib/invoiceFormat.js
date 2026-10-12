// File: src/lib/invoiceFormat.js
// Route: n/a (pure helpers shared by the client components AND the API routes; no DB access here)

export const money = (value) => `UGX ${Number(value ?? 0).toLocaleString()}`;
export const plain = (value) => Number(value ?? 0).toLocaleString();

export const fmtDate = (value, style = "short") => {
  if (!value) return "-";
  const options =
    style === "long"
      ? { day: "2-digit", month: "long", year: "numeric" }
      : { day: "2-digit", month: "short", year: "numeric" };
  return new Date(value).toLocaleDateString("en-GB", options);
};

export const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : "");
export const todayInput = () => new Date().toISOString().slice(0, 10);

export const lineTotal = (quantity, unitPrice) =>
  Math.max(0, Math.round((Number(quantity) || 0) * (Number(unitPrice) || 0)));

// subtotal / total / balance from line items + adjustments
export function calcTotals({ items = [], tax = 0, discount = 0, amountPaid = 0 }) {
  const subtotal = items.reduce((sum, i) => sum + lineTotal(i.quantity, i.unitPrice), 0);
  const t = Math.max(0, Number(tax) || 0);
  const d = Math.max(0, Number(discount) || 0);
  const paid = Math.max(0, Number(amountPaid) || 0);
  const total = Math.max(0, subtotal + t - d);
  const balance = Math.max(0, total - paid);
  return { subtotal, tax: t, discount: d, total, amountPaid: paid, balance };
}

// ───────── amount in words (for the printed invoice) ─────────
const ONES = [
  "", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven",
  "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen",
];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function below1000(n) {
  const parts = [];
  const h = Math.floor(n / 100);
  const r = n % 100;
  if (h) parts.push(`${ONES[h]} hundred`);
  if (r) {
    if (h) parts.push("and");
    parts.push(r < 20 ? ONES[r] : TENS[Math.floor(r / 10)] + (r % 10 ? `-${ONES[r % 10]}` : ""));
  }
  return parts.join(" ");
}

export function amountInWords(value) {
  let n = Math.round(Number(value) || 0);
  if (n <= 0) return "Zero Uganda shillings only";
  const scales = [
    [1e9, "billion"],
    [1e6, "million"],
    [1e3, "thousand"],
  ];
  const parts = [];
  for (const [size, name] of scales) {
    if (n >= size) {
      parts.push(`${below1000(Math.floor(n / size))} ${name}`);
      n %= size;
    }
  }
  if (n > 0) parts.push(below1000(n));
  const words = parts.join(", ");
  return `${words.charAt(0).toUpperCase()}${words.slice(1)} Uganda shillings only`;
}
