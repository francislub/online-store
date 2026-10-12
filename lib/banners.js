// lib/banners.js
// Route: n/a (shared helper for /api/banners and /api/banners/:id)
import { isValidId } from "@/lib/staff";

export { isValidId };

export function buildBannerWhere(q, status) {
  const where = {};
  const term = String(q || "").trim();

  if (term) {
    where.OR = [
      { title: { contains: term, mode: "insensitive" } },
      { link: { contains: term, mode: "insensitive" } },
    ];
  }
  if (status === "active") where.isActive = true;
  if (status === "inactive") where.isActive = false;

  return where;
}

// Validates and cleans a request body. Use { partial: true } for updates.
export function parseBannerBody(body, { partial = false } = {}) {
  const data = {};

  if (!partial || body.title !== undefined) {
    const title = String(body.title || "").trim();
    if (title.length < 2) return { error: "Banner title is required" };
    data.title = title;
  }

  if (!partial || body.imageUrl !== undefined) {
    const imageUrl = String(body.imageUrl || "").trim();
    if (!imageUrl) return { error: "Banner image is required" };
    data.imageUrl = imageUrl;
  }

  if (body.link !== undefined) {
    data.link = body.link ? String(body.link).trim() : null;
  }

  if (body.sortOrder !== undefined && body.sortOrder !== null && body.sortOrder !== "") {
    const n = Number(body.sortOrder);
    if (!Number.isInteger(n) || n < 0) return { error: "Sort order must be a whole number" };
    data.sortOrder = n;
  }

  if (body.isActive !== undefined) {
    data.isActive = Boolean(body.isActive);
  }

  return { data };
}