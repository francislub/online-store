// lib/catalog.js
// Route: n/a (server helpers for /api/storefront/products and /api/storefront/categories)
import db from "@/lib/db";
import { mapProduct } from "@/lib/storefront";

export const PRODUCT_SELECT = {
  id: true,
  name: true,
  slug: true,
  sku: true,
  brand: true,
  price: true,
  salePrice: true,
  stock: true,
  imageUrls: true,
  createdAt: true,
};

export const SORTS = {
  newest: [{ createdAt: "desc" }],
  featured: [{ isFeatured: "desc" }, { createdAt: "desc" }],
  "price-asc": [{ price: "asc" }],
  "price-desc": [{ price: "desc" }],
  "name-asc": [{ name: "asc" }],
};

const NEW_DAYS = 30;

function badgesFor(p) {
  const badges = [];
  if (p.salePrice != null && p.salePrice > 0 && p.salePrice < p.price) {
    const pct = Math.round(((p.price - p.salePrice) / p.price) * 100);
    badges.push({ label: `-${pct}%`, color: "bg-blue-600" });
  }
  const ageDays = (Date.now() - new Date(p.createdAt).getTime()) / 86400000;
  if (ageDays <= NEW_DAYS) badges.push({ label: "NEW", color: "bg-green-700" });
  return badges;
}

export const mapCatalogProduct = (p) => ({ ...mapProduct(p), badges: badgesFor(p) });

// category id + all its descendants
export function collectIds(rootId, byParent) {
  const ids = [rootId];
  const stack = [rootId];
  while (stack.length) {
    const id = stack.pop();
    for (const child of byParent.get(id) || []) {
      ids.push(child.id);
      stack.push(child.id);
    }
  }
  return ids;
}

export async function loadCategoryIndex() {
  const [all, grouped] = await Promise.all([
    db.category.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, description: true, imageUrl: true, parentId: true },
    }),
    db.product.groupBy({
      by: ["categoryId"],
      where: { isActive: true },
      _count: { _all: true },
    }),
  ]);

  const byId = new Map(all.map((c) => [c.id, c]));
  const byParent = new Map();
  for (const c of all) {
    const key = c.parentId || "root";
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(c);
  }

  const own = new Map(grouped.map((g) => [g.categoryId, g._count._all]));
  const countFor = (id) => collectIds(id, byParent).reduce((sum, cid) => sum + (own.get(cid) || 0), 0);

  const node = (c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description || null,
    image: c.imageUrl || null,
    count: countFor(c.id),
    href: `/category/${c.slug}`,
    children: (byParent.get(c.id) || []).map(node),
  });

  return { byId, byParent, tree: (byParent.get("root") || []).map(node), node };
}

export async function getCategoryContext(slug) {
  const idx = await loadCategoryIndex();
  const cat = [...idx.byId.values()].find((c) => c.slug === slug);
  if (!cat) return null;

  const node = idx.node(cat);

  const breadcrumb = [];
  const seen = new Set();
  let cur = cat;
  while (cur && !seen.has(cur.id)) {
    breadcrumb.unshift({ name: cur.name, slug: cur.slug });
    seen.add(cur.id);
    cur = cur.parentId ? idx.byId.get(cur.parentId) : null;
  }

  return {
    category: {
      id: node.id,
      name: node.name,
      slug: node.slug,
      description: node.description,
      image: node.image,
      count: node.count,
      breadcrumb,
      children: node.children,
    },
    ids: collectIds(cat.id, idx.byParent),
    tree: idx.tree,
  };
}

export async function queryProducts({
  categoryIds = null,
  q = "",
  brand = "",
  minPrice = null,
  maxPrice = null,
  inStock = false,
  sort = "newest",
  page = 1,
  limit = 12,
}) {
  // base = what the facets (brands, price range) are calculated from
  const base = { isActive: true };
  if (categoryIds) base.categoryId = { in: categoryIds };

  const term = String(q || "").trim();
  if (term) {
    base.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { brand: { contains: term, mode: "insensitive" } },
      { model: { contains: term, mode: "insensitive" } },
      { sku: { contains: term, mode: "insensitive" } },
    ];
  }

  const where = { ...base };
  if (brand) where.brand = { equals: brand, mode: "insensitive" };

  const price = {};
  if (minPrice != null) price.gte = minPrice;
  if (maxPrice != null) price.lte = maxPrice;
  if (Object.keys(price).length) where.price = price;

  if (inStock) where.stock = { gt: 0 };

  const [total, rows, brandRows, priceAgg] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy: SORTS[sort] || SORTS.newest,
      skip: (page - 1) * limit,
      take: limit,
      select: PRODUCT_SELECT,
    }),
    db.product.groupBy({
      by: ["brand"],
      where: { ...base, brand: { not: null } },
      _count: { _all: true },
      orderBy: { brand: "asc" },
    }),
    db.product.aggregate({ where: base, _min: { price: true }, _max: { price: true } }),
  ]);

  return {
    products: rows.map(mapCatalogProduct),
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    facets: {
      brands: brandRows
        .filter((b) => b.brand && b.brand.trim())
        .map((b) => ({ name: b.brand, count: b._count._all })),
      priceMin: priceAgg._min.price ?? 0,
      priceMax: priceAgg._max.price ?? 0,
    },
  };
}