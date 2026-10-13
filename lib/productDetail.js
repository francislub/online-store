// lib/productDetail.js
// Route: n/a (server helper for /product/:slug and /api/storefront/products/:slug)
import db from "@/lib/db";
import { PRODUCT_SELECT, mapProduct, badgesFor } from "@/lib/storefront";
import { slugify } from "@/lib/slugify";

const INCLUDE = {
  category: { select: { id: true, name: true, slug: true, parentId: true } },
};
const ORDER = [{ isFeatured: "desc" }, { createdAt: "desc" }];

// Accepts a slug OR a product name ("hp", "HP ProBook 450", "hp-probook-450")
async function findProduct(param) {
  let raw = String(param || "");
  try { raw = decodeURIComponent(raw); } catch {}
  raw = raw.trim();
  if (!raw) return null;

  const wanted = slugify(raw);
  const base = { isActive: true };

  // 1. exact slug (as typed, or slugified from the name)
  let p = await db.product.findFirst({
    where: { ...base, slug: { in: [...new Set([raw, wanted])] } },
    include: INCLUDE,
  });
  if (p) return p;

  // 2. exact product name, case-insensitive
  p = await db.product.findFirst({
    where: { ...base, name: { equals: raw, mode: "insensitive" } },
    include: INCLUDE,
  });
  if (p) return p;

  // 3. slug starts with the param (e.g. "hp" -> "hp-probook-450")
  p = await db.product.findFirst({
    where: { ...base, slug: { startsWith: wanted } },
    orderBy: ORDER,
    include: INCLUDE,
  });
  if (p) return p;

  // 4. name contains the param
  return db.product.findFirst({
    where: { ...base, name: { contains: raw, mode: "insensitive" } },
    orderBy: ORDER,
    include: INCLUDE,
  });
}

export async function getProductDetail(param) {
  const p = await findProduct(param);
  if (!p) return null;

  // breadcrumb: walk up the category tree (guarded against cycles)
  const breadcrumb = [];
  const seen = new Set();
  let cur = p.category;
  while (cur && !seen.has(cur.id) && breadcrumb.length < 6) {
    seen.add(cur.id);
    breadcrumb.unshift({ name: cur.name, slug: cur.slug });
    cur = cur.parentId
      ? await db.category.findUnique({
          where: { id: cur.parentId },
          select: { id: true, name: true, slug: true, parentId: true },
        })
      : null;
  }

  const relatedRows = await db.product.findMany({
    where: { isActive: true, categoryId: p.categoryId, id: { not: p.id } },
    orderBy: ORDER,
    take: 6,
    select: PRODUCT_SELECT,
  });

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
      href: `/product/${slug}`, // always built from the product's own slug/name
      badges: badgesFor(p),
      images: p.imageUrls || [],
      description: p.description || "",
      model: p.model || "",
      barcode: p.barcode || "",
      warrantyMonths: p.warrantyMonths || 0,
      tags: p.tags || [],
      specs,
      category: p.category ? { name: p.category.name, slug: p.category.slug } : null,
      breadcrumb,
    },
    related: relatedRows.map((r) => {
      const m = mapProduct(r);
      const s = r.slug || slugify(r.name);
      return { ...m, slug: s, href: `/product/${s}` };
    }),
  };
}