// lib/banners.js
// Route: n/a (shared helper for /api/banners and /api/banners/:id)
import { isValidId } from "@/lib/staff";

export { isValidId };

export const PLACEMENTS = ["SLIDER", "TOP", "BOTTOM"];

export const PLACEMENT_LABELS = {
  SLIDER: "Home Slider (left, large)",
  TOP: "Top Right Banner",
  BOTTOM: "Bottom Right Banner (max 2)",
};

export function buildBannerWhere(q, status, placement) {
  const where = {};
  const term = String(q || "").trim();

  if (term) {
    where.OR = [
      { title: { contains: term, mode: "insensitive" } },
      { subtitle: { contains: term, mode: "insensitive" } },
      { link: { contains: term, mode: "insensitive" } },
    ];
  }
  if (status === "active") where.isActive = true;
  if (status === "inactive") where.isActive = false;
  if (PLACEMENTS.includes(placement)) where.placement = placement;

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

  if (body.subtitle !== undefined) {
    data.subtitle = body.subtitle ? String(body.subtitle).trim() : null;
  }

  if (body.ctaLabel !== undefined) {
    data.ctaLabel = body.ctaLabel ? String(body.ctaLabel).trim() : null;
  }

  if (body.link !== undefined) {
    data.link = body.link ? String(body.link).trim() : null;
  }

  if (body.placement !== undefined && body.placement !== null && body.placement !== "") {
    if (!PLACEMENTS.includes(body.placement)) return { error: "Invalid banner placement" };
    data.placement = body.placement;
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