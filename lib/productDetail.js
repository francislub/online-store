// lib/productDetail.js
// Route: n/a (server helper for /product/:id and /api/storefront/products/:id)
import db from "@/lib/db";
import { PRODUCT_SELECT, mapProduct, badgesFor } from "@/lib/storefront";
import { slugify } from "@/lib/slugify";

const ORDER = [{ isFeatured: "desc" }, { createdAt: "desc" }];
const CATEGORY_SELECT = { id: true, name: true, slug: true, parentId: true };

const isObjectId = (v) => /^[a-f\d]{24}$/i.test(String(v));

// Public URL for a product: /product/<product id>
export const productHref = (p) => `/product/${p.id}`;

// Loads the product row WITHOUT including the category relation.
// (include on a required relation throws if the category document is missing,
//  which used to turn into a 404 on the page.)
async function findProduct(param) {
  let raw = String(param || "");
  try {
    raw = decodeURIComponent(raw);
  } catch {}
  raw = raw.trim();
  if (!raw) return null;

  const base = { isActive: true };

  // 0. the product id (the normal case)
  if (isObjectId(raw)) {
    const byId = await db.product.findFirst({ where: { ...base, id: raw } });
    if (byId) return byId;

    // Helpful diagnostics: does it exist but is inactive?
    const any = await db.product.findUnique({
      where: { id: raw },
      select: { id: true, isActive: true },
    });
    if (any && !any.isActive) {
      console.warn(`[productDetail] product ${raw} exists but isActive=false`);
    } else if (!any) {
      console.warn(`[productDetail] no product with id ${raw} (check DATABASE_URL / database)`);
    }
  }

  const lower = raw.toLowerCase();
  const wanted = slugify(raw);

  // 1. exact slug: as typed, lower-cased, or slugified from a name
  const candidates = [...new Set([raw, lower, wanted].filter(Boolean))];
  let p = await db.product.findFirst({ where: { ...base, slug: { in: candidates } } });
  if (p) return p;

  // 2. exact product name, case-insensitive
  p = await db.product.findFirst({
    where: { ...base, name: { equals: raw, mode: "insensitive" } },
  });
  if (p) return p;

  // 3. slug starts with the param (e.g. "hp" -> "hp-probook-450")
  if (wanted) {
    p = await db.product.findFirst({
      where: { ...base, slug: { startsWith: wanted } },
      orderBy: ORDER,
    });
    if (p) return p;
  }

  // 4. name contains the param
  return db.product.findFirst({
    where: { ...base, name: { contains: raw, mode: "insensitive" } },
    orderBy: ORDER,
  });
}

async function loadCategory(categoryId) {
  if (!categoryId) return null;
  try {
    return await db.category.findUnique({ where: { id: categoryId }, select: CATEGORY_SELECT });
  } catch (err) {
    console.error("[productDetail] category lookup failed:", err?.message || err);
    return null;
  }
}

// Returns null ONLY when the product does not exist.
// Real database errors are thrown so they are not mistaken for a 404.
export async function getProductDetail(param) {
  const p = await findProduct(param);
  if (!p) return null;

  const category = await loadCategory(p.categoryId);
  if (!category) {
    console.warn(`[productDetail] product ${p.id} has a missing category (${p.categoryId})`);
  }

  // breadcrumb: walk up the category tree (guarded against cycles)
  const breadcrumb = [];
  const seen = new Set();
  let cur = category;
  while (cur && !seen.has(cur.id) && breadcrumb.length < 6) {
    seen.add(cur.id);
    breadcrumb.unshift({ name: cur.name, slug: cur.slug });
    cur = cur.parentId ? await loadCategory(cur.parentId) : null;
  }

  // related products must never break the page
  let relatedRows = [];
  try {
    relatedRows = await db.product.findMany({
      where: { isActive: true, categoryId: p.categoryId, id: { not: p.id } },
      orderBy: ORDER,
      take: 6,
      select: PRODUCT_SELECT,
    });
  } catch (err) {
    console.error("[productDetail] related products failed:", err?.message || err);
  }

  // attributes can be { "RAM": "16GB" } or [{ name, value }]
  let specs = [];
  const a = p.attributes;
  if (Array.isArray(a)) {
    specs = a
      .filter((x) => x && (x.name || x.label) && x.value != null)
      .map((x) => ({ label: String(x.name || x.label), value: String(x.value) }));
  } else if (a && typeof a === "object") {
    specs = Object.entries(a)
      .filter(([, v]) => v != null && typeof v !== "object")
      .map(([k, v]) => ({ label: k, value: String(v) }));
  }

  const slug = p.slug || slugify(p.name);

  return {
    product: {
      ...mapProduct(p),
      slug,
      href: `/product/${p.id}`,
      badges: badgesFor(p),
      images: p.imageUrls || [],
      description: p.description || "",
      model: p.model || "",
      barcode: p.barcode || "",
      warrantyMonths: p.warrantyMonths || 0,
      tags: p.tags || [],
      specs,
      category: category ? { name: category.name, slug: category.slug } : null,
      breadcrumb,
    },
    related: relatedRows.map((r) => {
      const m = mapProduct(r);
      const s = r.slug || slugify(r.name);
      return { ...m, slug: s, href: `/product/${r.id}` };
    }),
  };
}