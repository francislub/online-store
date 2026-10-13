// lib/storefront.js
// Route: n/a (server helper used by /api/storefront/home)
import db from "@/lib/db";

export const HOME_SETTING_KEY = "home-sections";

// Used when nothing is saved in AppSetting yet. Promos are null = hidden.
export const DEFAULT_HOME_CONFIG = {
  newArrivals: { limit: 6 },
  laptops: { categorySlug: "laptops-desktops", limit: 4 },
  monitors: { categorySlug: "monitors", limit: 6 },
  accessories: { categorySlug: "accessories", limit: 4 },
  pcHardware: { categorySlug: "pc-hardware", limit: 6 },
  laptopPromo: null, // { tag, title, cta, href, image }
  accessoriesBanner: null, // { title, subtitle, cta, href, image }
  bluetooth: {
    categorySlug: "bluetooth-speakers",
    title: "Bluetooth speakers",
    subtitle: "Your music, your freedom explore portable Bluetooth speakers.",
    image: null,
    featuredSlug: null, // product slug; falls back to a featured product in the category
    chips: [
      { label: "PARTY", href: "/category/bluetooth-speakers?type=party", icon: "party" },
      { label: "IN DOOR", href: "/category/bluetooth-speakers?type=indoor", icon: "indoor" },
      { label: "OUT DOOR", href: "/category/bluetooth-speakers?type=outdoor", icon: "outdoor" },
      { label: "MINI", href: "/category/bluetooth-speakers?type=mini", icon: "mini" },
    ],
    tiles: [],
  },
};

const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);

function mergeConfig(base, saved) {
  const out = { ...base };
  for (const key of Object.keys(saved || {})) {
    if (isObj(base[key]) && isObj(saved[key])) out[key] = { ...base[key], ...saved[key] };
    else out[key] = saved[key];
  }
  return out;
}

export async function getHomeConfig() {
  const row = await db.appSetting.findUnique({ where: { key: HOME_SETTING_KEY } });
  return mergeConfig(DEFAULT_HOME_CONFIG, isObj(row?.value) ? row.value : {});
}

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

const NEW_DAYS = 30;

// Single definition: maps a Product row to what the storefront components expect.
export function mapProduct(p) {
  const onSale = p.salePrice != null && p.salePrice > 0 && p.salePrice < p.price;
  return {
    id: p.id,
    name: p.name,
    brand: p.brand || "",
    sku: p.sku,
    price: onSale ? p.salePrice : p.price,
    oldPrice: onSale ? p.price : null,
    image: p.imageUrls?.[0] || null,
    href: `/product/${p.slug}`,
    inStock: p.stock > 0,
    stock: p.stock,
  };
}

export function badgesFor(p) {
  const badges = [];
  if (p.salePrice != null && p.salePrice > 0 && p.salePrice < p.price) {
    const pct = Math.round(((p.price - p.salePrice) / p.price) * 100);
    badges.push({ label: `-${pct}%`, color: "bg-blue-600" });
  }
  const ageDays = (Date.now() - new Date(p.createdAt).getTime()) / 86400000;
  if (ageDays <= NEW_DAYS) badges.push({ label: "NEW", color: "bg-green-700" });
  return badges;
}

// category id + all its descendants -> category ids
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

export async function getHomeData() {
  const config = await getHomeConfig();

  const allCategories = await db.category.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, slug: true, imageUrl: true, parentId: true },
  });

  const bySlug = new Map(allCategories.map((c) => [c.slug, c]));
  const byParent = new Map();
  for (const c of allCategories) {
    const key = c.parentId || "root";
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(c);
  }

  // active product count per category (own products), then rolled up with sub-categories
  const grouped = await db.product.groupBy({
    by: ["categoryId"],
    where: { isActive: true },
    _count: { _all: true },
  });
  const own = new Map(grouped.map((g) => [g.categoryId, g._count._all]));
  const countFor = (id) => collectIds(id, byParent).reduce((sum, cid) => sum + (own.get(cid) || 0), 0);

  const categories = (byParent.get("root") || []).map((c) => ({
    id: c.id,
    name: c.name,
    count: countFor(c.id),
    image: c.imageUrl || null,
    href: `/category/${c.slug}`,
  }));

  async function bySection(section) {
    const cfg = config[section];
    if (!cfg?.categorySlug) return [];
    const root = bySlug.get(cfg.categorySlug);
    if (!root) return [];
    const products = await db.product.findMany({
      where: { isActive: true, categoryId: { in: collectIds(root.id, byParent) } },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      take: cfg.limit || 6,
      select: PRODUCT_SELECT,
    });
    return products.map(mapProduct);
  }

  async function getBluetooth() {
    const cfg = config.bluetooth;
    if (!cfg) return null;

    let featuredRow = null;
    if (cfg.featuredSlug) {
      featuredRow = await db.product.findFirst({
        where: { slug: cfg.featuredSlug, isActive: true },
        select: PRODUCT_SELECT,
      });
    }
    if (!featuredRow && cfg.categorySlug && bySlug.get(cfg.categorySlug)) {
      const ids = collectIds(bySlug.get(cfg.categorySlug).id, byParent);
      featuredRow = await db.product.findFirst({
        where: { isActive: true, isFeatured: true, categoryId: { in: ids } },
        orderBy: { createdAt: "desc" },
        select: PRODUCT_SELECT,
      });
    }

    return {
      title: cfg.title,
      subtitle: cfg.subtitle,
      image: cfg.image || null,
      chips: cfg.chips || [],
      tiles: cfg.tiles || [],
      featured: featuredRow ? { ...mapProduct(featuredRow), badges: badgesFor(featuredRow) } : null,
    };
  }

  const newArrivalsRows = await db.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    take: config.newArrivals?.limit || 6,
    select: PRODUCT_SELECT,
  });

  const [laptops, monitors, accessories, pcHardware, bluetooth] = await Promise.all([
    bySection("laptops"),
    bySection("monitors"),
    bySection("accessories"),
    bySection("pcHardware"),
    getBluetooth(),
  ]);

  return {
    categories,
    newArrivals: newArrivalsRows.map(mapProduct),
    laptops,
    laptopPromo: config.laptopPromo || null,
    monitors,
    accessoriesBanner: config.accessoriesBanner || null,
    accessories,
    pcHardware,
    bluetooth,
  };
}