// app/api/storefront/products/route.js
// Route: /api/storefront/products  (GET, public)
// Query: ?category=slug &q= &brand= &minPrice= &maxPrice= &inStock=true
//        &sort=newest|featured|price-asc|price-desc|name-asc &page=1 &limit=12
import { NextResponse } from "next/server";
import { getCategoryContext, queryProducts, SORTS } from "@/lib/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TAG = "[api/storefront/products]";

const toInt = (v) => {
  if (v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
};

export async function GET(request) {
  try {
    const sp = new URL(request.url).searchParams;

    const categorySlug = sp.get("category");
    let category = null;
    let categoryIds = null;
    let rootCategories = null;

    if (categorySlug) {
      const ctx = await getCategoryContext(categorySlug);
      if (!ctx) {
        return NextResponse.json({ message: "Category not found" }, { status: 404 });
      }
      category = ctx.category;
      categoryIds = ctx.ids;
    }

    let minPrice = toInt(sp.get("minPrice"));
    let maxPrice = toInt(sp.get("maxPrice"));
    if (minPrice != null && maxPrice != null && minPrice > maxPrice) [minPrice, maxPrice] = [maxPrice, minPrice];

    const sortParam = sp.get("sort");
    const sort = SORTS[sortParam] ? sortParam : "newest";

    const result = await queryProducts({
      categoryIds,
      q: sp.get("q") || "",
      brand: (sp.get("brand") || "").trim(),
      minPrice,
      maxPrice,
      inStock: sp.get("inStock") === "true",
      sort,
      page: Math.max(1, toInt(sp.get("page")) || 1),
      limit: Math.min(48, Math.max(1, toInt(sp.get("limit")) || 12)),
    });

    // sidebar category list: sub-categories when inside a category, top-level otherwise
    let sidebarCategories;
    if (category) {
      sidebarCategories = category.children;
    } else {
      const { loadCategoryIndex } = await import("@/lib/catalog");
      rootCategories = (await loadCategoryIndex()).tree;
      sidebarCategories = rootCategories;
    }

    return NextResponse.json({
      data: result.products,
      pagination: result.pagination,
      facets: {
        ...result.facets,
        categories: sidebarCategories.map((c) => ({ id: c.id, name: c.name, slug: c.slug, count: c.count })),
      },
      category,
    });
  } catch (err) {
    console.error(`${TAG} ERROR:`, err?.code || "", err?.message || err);
    return NextResponse.json({ message: "Failed to load products" }, { status: 500 });
  }
}