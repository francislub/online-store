// lib/numbering.js
// Route: n/a (document number generator: ORD-261012-A8K2, INV-..., QT-..., PAY-...)

const stamp = () => {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
};

const suffix = () => Math.random().toString(36).slice(2, 6).toUpperCase();

export const makeNumber = (prefix) => `${prefix}-${stamp()}-${suffix()}`;
