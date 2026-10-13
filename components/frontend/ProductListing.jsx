// src/components/frontend/ProductListing.jsx
// Route: /products and /category/:slug (shared listing with filters, sorting, pagination)
"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, SlidersHorizontal, X } from "lucide-react";
import ProductCard from "./ProductCard";
import { formatUGX } from "@/context/CartContext";

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-asc", label: "Name: A to Z" },
];

function pageList(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const keep = [...new Set([1, total, current - 1, current, current + 1])]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
  const out = [];
  keep.forEach((p, i) => {
    if (i && p - keep[i - 1] > 1) out.push(`gap-${p}`);
    out.push(p);
  });
  return out;
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-[340px] animate-pulse rounded-xl bg-gray-200" />
      ))}
    </div>
  );
}

export default function ProductListing({ categorySlug = null, title = "All Products" }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();

  const q = searchParams.get("q") || "";
  const sort = searchParams.get("sort") || "newest";
  const brand = searchParams.get("brand") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const inStock = searchParams.get("inStock") === "true";

  const [state, setState] = useState({
    loading: true,
    error: "",
    notFound: false,
    products: [],
    pagination: null,
    facets: null,
    category: null,
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [minInput, setMinInput] = useState(minPrice);
  const [maxInput, setMaxInput] = useState(maxPrice);

  useEffect(() => {
    setMinInput(minPrice);
    setMaxInput(maxPrice);
  }, [minPrice, maxPrice]);

  // fetch from the database whenever the URL filters change
  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      setState((s) => ({ ...s, loading: true, error: "" }));
      try {
        const params = new URLSearchParams(queryString);
        if (categorySlug) params.set("category", categorySlug);
        params.set("limit", String(PAGE_SIZE));

        const res = await fetch(`/api/storefront/products?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const json = await res.json().catch(() => null);

        if (res.status === 404) {
          setState((s) => ({ ...s, loading: false, notFound: true, products: [] }));
          return;
        }
        if (!res.ok) throw new Error(json?.message || "Failed to load products");

        setState({
          loading: false,
          error: "",
          notFound: false,
          products: json.data || [],
          pagination: json.pagination,
          facets: json.facets,
          category: json.category,
        });
      } catch (err) {
        if (err.name === "AbortError") return;
        console.log("[ProductListing]", err);
        setState((s) => ({ ...s, loading: false, error: err.message || "Network error" }));
      }
    })();

    return () => controller.abort();
  }, [queryString, categorySlug]);

  const updateParams = useCallback(
    (changes) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(changes).forEach(([k, v]) => {
        if (v === null || v === undefined || v === "" || v === false) params.delete(k);
        else params.set(k, String(v));
      });
      if (!("page" in changes)) params.delete("page"); // any filter change goes back to page 1
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  const { loading, error, notFound, products, pagination, facets, category } = state;
  const heading = category?.name || title;
  const hasFilters = Boolean(q || brand || minPrice || maxPrice || inStock);

  if (notFound) {
    return (
      <section className="mx-auto max-w-[1400px] px-4 py-20 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900">Category not found</h1>
        <p className="mt-2 text-gray-500">This category doesn’t exist or is no longer available.</p>
        <Link href="/category" className="mt-5 inline-block rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
          Browse all categories
        </Link>
      </section>
    );
  }

  const filters = (
    <aside className={`${filtersOpen ? "block" : "hidden"} space-y-6 lg:block`}>
      {/* categories */}
      {facets?.categories?.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-900">
            {category ? "Sub-categories" : "Categories"}
          </h3>
          <ul className="space-y-1.5 text-sm">
            {category && (
              <li>
                <Link href="/category" className="text-gray-500 hover:text-blue-600">
                  ← All categories
                </Link>
              </li>
            )}
            {facets.categories.map((c) => (
              <li key={c.id}>
                <Link href={`/category/${c.slug}`} className="flex justify-between text-gray-700 hover:text-blue-600">
                  <span>{c.name}</span>
                  <span className="text-gray-400">{c.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* brands */}
      {facets?.brands?.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-900">Brand</h3>
          <ul className="space-y-1.5 text-sm">
            {facets.brands.map((b) => (
              <li key={b.name}>
                <label className="flex cursor-pointer items-center justify-between gap-2 text-gray-700">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={brand.toLowerCase() === b.name.toLowerCase()}
                      onChange={(e) => updateParams({ brand: e.target.checked ? b.name : "" })}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    {b.name}
                  </span>
                  <span className="text-gray-400">{b.count}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* price */}
      <div>
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-900">Price (UGX)</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            value={minInput}
            onChange={(e) => setMinInput(e.target.value)}
            placeholder={facets?.priceMin ? String(facets.priceMin) : "Min"}
            className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <span className="text-gray-400">–</span>
          <input
            type="number"
            min="0"
            value={maxInput}
            onChange={(e) => setMaxInput(e.target.value)}
            placeholder={facets?.priceMax ? String(facets.priceMax) : "Max"}
            className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => updateParams({ minPrice: minInput, maxPrice: maxInput })}
          className="mt-2 w-full rounded-md bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Apply
        </button>
      </div>

      {/* availability */}
      <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={inStock}
          onChange={(e) => updateParams({ inStock: e.target.checked ? "true" : "" })}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        In stock only
      </label>
    </aside>
  );

  return (
    <section className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      {/* breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-1 text-sm text-gray-500">
        <Link href="/" className="hover:text-blue-600">Home</Link>
        <ChevronRight size={14} />
        {category ? (
          <>
            <Link href="/category" className="hover:text-blue-600">Categories</Link>
            {category.breadcrumb.map((b, i) => (
              <React.Fragment key={b.slug}>
                <ChevronRight size={14} />
                {i === category.breadcrumb.length - 1 ? (
                  <span className="font-medium text-gray-800">{b.name}</span>
                ) : (
                  <Link href={`/category/${b.slug}`} className="hover:text-blue-600">{b.name}</Link>
                )}
              </React.Fragment>
            ))}
          </>
        ) : (
          <span className="font-medium text-gray-800">{heading}</span>
        )}
      </nav>

      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{heading}</h1>
          {category?.description && <p className="mt-1 max-w-2xl text-sm text-gray-500">{category.description}</p>}
          {pagination && (
            <p className="mt-1 text-sm text-gray-500">
              {pagination.total} product{pagination.total === 1 ? "" : "s"}
              {q && <> for “{q}”</>}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 lg:hidden"
          >
            <SlidersHorizontal size={16} /> Filters
          </button>
          <select
            value={sort}
            onChange={(e) => updateParams({ sort: e.target.value === "newest" ? "" : e.target.value })}
            aria-label="Sort products"
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:ring-blue-500"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* active filter chips */}
      {hasFilters && (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
          {q && <Chip label={`Search: ${q}`} onClear={() => updateParams({ q: "" })} />}
          {brand && <Chip label={brand} onClear={() => updateParams({ brand: "" })} />}
          {(minPrice || maxPrice) && (
            <Chip
              label={`${minPrice ? formatUGX(minPrice) : "Any"} – ${maxPrice ? formatUGX(maxPrice) : "Any"}`}
              onClear={() => updateParams({ minPrice: "", maxPrice: "" })}
            />
          )}
          {inStock && <Chip label="In stock" onClear={() => updateParams({ inStock: "" })} />}
          <button
            onClick={() => router.push(pathname, { scroll: false })}
            className="text-blue-600 underline"
          >
            Clear all
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {filters}

        <div>
          {error ? (
            <div className="rounded-xl bg-white p-10 text-center shadow-sm">
              <p className="text-red-600">{error}</p>
              <button onClick={() => router.refresh()} className="mt-3 text-sm text-blue-600 underline">
                Try again
              </button>
            </div>
          ) : loading && products.length === 0 ? (
            <GridSkeleton />
          ) : products.length === 0 ? (
            <div className="rounded-xl bg-white p-10 text-center shadow-sm">
              <p className="text-lg font-semibold text-gray-800">No products found</p>
              <p className="mt-1 text-sm text-gray-500">
                {hasFilters ? "Try removing some filters." : "Check back soon for new stock."}
              </p>
            </div>
          ) : (
            <div
              className={`grid grid-cols-2 gap-4 transition-opacity md:grid-cols-3 xl:grid-cols-4 ${
                loading ? "opacity-60" : ""
              }`}
            >
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          {/* pagination */}
          {pagination && pagination.totalPages > 1 && (
            <nav aria-label="Pagination" className="mt-8 flex flex-wrap items-center justify-center gap-1.5">
              <button
                disabled={pagination.page <= 1}
                onClick={() => updateParams({ page: pagination.page - 1 > 1 ? pagination.page - 1 : "" })}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm disabled:opacity-40"
              >
                Prev
              </button>
              {pageList(pagination.page, pagination.totalPages).map((p) =>
                typeof p === "string" ? (
                  <span key={p} className="px-1 text-gray-400">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => updateParams({ page: p > 1 ? p : "" })}
                    aria-current={p === pagination.page ? "page" : undefined}
                    className={`min-w-[36px] rounded-md border px-3 py-1.5 text-sm ${
                      p === pagination.page
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-gray-300 bg-white text-gray-700 hover:border-blue-600"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => updateParams({ page: pagination.page + 1 })}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm disabled:opacity-40"
              >
                Next
              </button>
            </nav>
          )}
        </div>
      </div>
    </section>
  );
}

function Chip({ label, onClear }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-blue-700">
      {label}
      <button onClick={onClear} aria-label={`Remove ${label}`}>
        <X size={14} />
      </button>
    </span>
  );
}