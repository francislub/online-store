// src/components/frontend/SideRail.jsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Menu, X, ChevronRight, ShoppingBag, Box, Cpu, Laptop, Smartphone,
  Package, Layers, Gamepad2, Watch, Headphones, Camera, Printer, Monitor,
} from "lucide-react";
import { CATEGORIES } from "@/lib/siteConfig";

const ICONS = {
  bag: ShoppingBag, box: Box, chip: Cpu, laptop: Laptop, phone: Smartphone,
  case: Package, layers: Layers, gamepad: Gamepad2, watch: Watch,
  headphones: Headphones, camera: Camera, printer: Printer, monitor: Monitor,
};

// The database has no icon/promo fields, so they are looked up in siteConfig by slug.
const CONFIG_BY_SLUG = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c]));

const catHref = (c) => `/category/${c.slug}`;

// Build a tree from the flat list returned by /api/categories
function buildTree(list) {
  const active = list.filter((c) => c.isActive !== false);
  const byParent = new Map();
  for (const c of active) {
    const key = c.parentId ?? "root";
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(c);
  }
  const sortFn = (a, b) => a.name.localeCompare(b.name);
  const attach = (node) => ({
    ...node,
    children: [...(byParent.get(node.id) ?? [])].sort(sortFn).map(attach),
  });
  return [...(byParent.get("root") ?? [])].sort(sortFn).map(attach);
}

function Thumb({ src, alt, size = 36 }) {
  if (!src) return null;
  return (
    <span
      className="relative shrink-0 overflow-hidden rounded-md bg-gray-100"
      style={{ width: size, height: size }}
    >
      <Image src={src} alt={alt} fill sizes={`${size}px`} className="object-cover" unoptimized />
    </span>
  );
}

/**
 * Fixed left rail.
 *  - collapsed: icons only (desktop)
 *  - hover:     expands over the page (no layout shift)
 *  - open:      expands fully with a dark backdrop (hamburger / "All Categories" button)
 *  - mobile:    hidden until opened
 *
 * Categories, sub-categories and images come from the database (/api/categories).
 */
export default function SideRail({ open, setOpen }) {
  const [hover, setHover] = useState(false);
  const [flyout, setFlyout] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const expanded = open || hover;

  // load categories from the database
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/categories");
        if (!res.ok) throw new Error("Failed to load categories");
        const data = await res.json();
        if (!cancelled && Array.isArray(data)) setCategories(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const tree = useMemo(() => buildTree(categories), [categories]);

  // "All Products" stays as the first static entry
  const items = useMemo(
    () => [
      { id: "all", slug: "all-products", name: "All Products", href: "/products", children: [] },
      ...tree,
    ],
    [tree]
  );

  const active = items.find(
    (c) => c.slug === flyout && (c.children.length > 0 || c.imageUrl || CONFIG_BY_SLUG[c.slug]?.promo)
  );
  const activePromo = active ? CONFIG_BY_SLUG[active.slug]?.promo : null;

  return (
    <>
      {/* backdrop */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => { setHover(false); setFlyout(null); }}
        aria-label="Product categories"
        className={`fixed left-0 top-0 z-50 h-screen border-r border-gray-200 bg-white shadow-xl transition-all duration-300 ease-out
          ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${expanded ? "w-72 lg:w-64" : "w-72 lg:w-14"}`}
      >
        {/* toggle */}
        <div className="p-1.5">
          <button
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close categories" : "Open categories"}
            className={`flex h-10 items-center rounded-full bg-blue-600 text-white shadow transition-all hover:bg-blue-700
              ${expanded ? "w-full gap-3 px-3" : "w-10 justify-center"}`}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
            {expanded && <span className="text-sm font-semibold">All Categories</span>}
          </button>
        </div>

        {/* list */}
        <nav className="h-[calc(100vh-56px)] overflow-y-auto overflow-x-hidden pb-4 [scrollbar-width:thin]">
          <ul>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <li key={i} className="flex h-[45px] items-center gap-3 px-[18px]">
                    <span className="h-[19px] w-[19px] shrink-0 animate-pulse rounded bg-gray-200" />
                    {expanded && <span className="h-3 flex-1 animate-pulse rounded bg-gray-200" />}
                  </li>
                ))
              : items.map((c) => {
                  const Icon = ICONS[CONFIG_BY_SLUG[c.slug]?.icon] ?? Box;
                  const isActive = flyout === c.slug;
                  const hasMore = c.children.length > 0;
                  return (
                    <li key={c.id} onMouseEnter={() => setFlyout(c.slug)}>
                      <Link
                        href={c.href ?? catHref(c)}
                        onClick={() => setOpen(false)}
                        title={c.name}
                        className={`group flex h-[45px] items-center gap-3 px-[18px] text-[13.5px] font-semibold transition-colors hover:bg-gray-50 hover:text-blue-700
                          ${isActive ? "text-blue-700" : "text-gray-800"}`}
                      >
                        <Icon size={19} className="shrink-0" />
                        <span
                          className={`flex-1 whitespace-nowrap transition-opacity duration-200 ${
                            expanded ? "opacity-100" : "opacity-0"
                          }`}
                        >
                          {c.name}
                        </span>
                        {hasMore && expanded && (
                          <ChevronRight size={14} className="text-gray-400" />
                        )}
                      </Link>
                    </li>
                  );
                })}
          </ul>
        </nav>

        {/* flyout (desktop only) */}
        {expanded && active && (
          <div className="absolute left-full top-0 hidden h-screen w-72 overflow-y-auto border-l border-gray-100 bg-white/95 p-6 shadow-2xl backdrop-blur lg:block">
            <Link
              href={active.href ?? catHref(active)}
              onClick={() => setOpen(false)}
              className="mb-4 block text-[13px] font-bold uppercase tracking-wide text-gray-900 hover:text-blue-700"
            >
              {active.name}
            </Link>

            {/* category's own image, shown when it has one */}
            {active.imageUrl && (
              <Link
                href={catHref(active)}
                onClick={() => setOpen(false)}
                className="relative mb-4 block h-28 w-full overflow-hidden rounded-lg bg-gray-100"
              >
                <Image
                  src={active.imageUrl}
                  alt={active.name}
                  fill
                  sizes="240px"
                  className="object-cover"
                  unoptimized
                />
              </Link>
            )}

            <ul className="space-y-3">
              {active.children.map((child) => (
                <li key={child.id}>
                  <Link
                    href={catHref(child)}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 text-sm text-gray-500 transition-colors hover:text-blue-700"
                  >
                    <Thumb src={child.imageUrl} alt={child.name} />
                    <span>{child.name}</span>
                  </Link>

                  {/* third level, if any */}
                  {child.children.length > 0 && (
                    <ul className="ml-3 mt-2 space-y-2 border-l border-gray-100 pl-3">
                      {child.children.map((sub) => (
                        <li key={sub.id}>
                          <Link
                            href={catHref(sub)}
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-2 text-[13px] text-gray-400 transition-colors hover:text-blue-700"
                          >
                            <Thumb src={sub.imageUrl} alt={sub.name} size={24} />
                            <span>{sub.name}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>

            {activePromo && (
              <Link
                href={activePromo.href}
                onClick={() => setOpen(false)}
                className="mt-6 block overflow-hidden rounded-lg bg-gradient-to-b from-[#0b1230] to-[#1d3fa8] text-center text-white"
              >
                <div className="px-4 pt-6">
                  <p className="text-xs uppercase tracking-wider text-white/70">{activePromo.tag}</p>
                  <p className="mt-2 text-lg font-bold">{activePromo.title}</p>
                  <span className="mt-4 inline-block rounded bg-blue-600 px-4 py-2 text-xs font-semibold">
                    {activePromo.cta}
                  </span>
                </div>
                <div className="relative mt-4 h-56">
                  <Image
                    src={activePromo.image}
                    alt={activePromo.title}
                    fill
                    sizes="240px"
                    className="object-contain"
                  />
                </div>
              </Link>
            )}
          </div>
        )}
      </aside>
    </>
  );
}