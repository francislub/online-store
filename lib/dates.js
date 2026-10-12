// lib/dates.js
// Route: n/a (date helpers, Uganda time UTC+3, safe on client and server)
const EAT_OFFSET_MS = 3 * 60 * 60 * 1000;

export const isDay = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || "");
export const dayKey = (d) => new Date(new Date(d).getTime() + EAT_OFFSET_MS).toISOString().slice(0, 10);
export const monthKey = (d) => dayKey(d).slice(0, 7);
export const todayKey = () => dayKey(new Date());
export const startOfDay = (s) => new Date(`${s}T00:00:00.000+03:00`);
export const endOfDay = (s) => new Date(`${s}T23:59:59.999+03:00`);
export const noonOfDay = (s) => new Date(`${s}T12:00:00.000+03:00`);

const pad = (n) => String(n).padStart(2, "0");

export function presetRange(preset) {
  const t = todayKey();
  const [y, m] = t.split("-").map(Number);
  if (preset === "today") return { from: t, to: t };
  if (preset === "week") {
    return { from: dayKey(new Date(startOfDay(t).getTime() - 6 * 86400000)), to: t };
  }
  if (preset === "lastMonth") {
    const ly = m === 1 ? y - 1 : y;
    const lm = m === 1 ? 12 : m - 1;
    const lastDay = new Date(y, m - 1, 0).getDate();
    return { from: `${ly}-${pad(lm)}-01`, to: `${ly}-${pad(lm)}-${pad(lastDay)}` };
  }
  if (preset === "year") return { from: `${y}-01-01`, to: t };
  return { from: `${y}-${pad(m)}-01`, to: t }; // "month" (default)
}