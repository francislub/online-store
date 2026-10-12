// src/components/frontend/SideRail.jsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Menu, X, ChevronRight, ShoppingBag, Box, Cpu, Laptop, Smartphone,
  Package, Layers, Gamepad2, Watch, Headphones, Camera, Printer, Monitor,
} from "lucide-react";
import { CATEGORIES, slugify } from "@/lib/siteConfig";

const ICONS = {
  bag: ShoppingBag, box: Box, chip: Cpu, laptop: Laptop, phone: Smartphone,
  case: Package, layers: Layers, gamepad: Gamepad2, watch: Watch,
  headphones: Headphones, camera: Camera, printer: Printer, monitor: Monitor,
};

const catHref = (c) => c.href ?? `/category/${c.slug}`;

/**
 * Fixed left rail.
 *  - collapsed: icons only (desktop)
 *  - hover:     expands over the page (no layout shift)
 *  - open:      expands fully with a dark backdrop (hamburger / "All Categories" button)
 *  - mobile:    hidden until opened
 */
export default function SideRail({ open, setOpen }) {
  const [hover, setHover] = useState(false);
  const [flyout, setFlyout] = useState(null);
  const expanded = open || hover;

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const active = CATEGORIES.find((c) => c.slug === flyout && c.children);

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
            {CATEGORIES.map((c) => {
              const Icon = ICONS[c.icon] ?? Box;
              const isActive = flyout === c.slug;
              return (
                <li key={c.slug} onMouseEnter={() => setFlyout(c.slug)}>
                  <Link
                    href={catHref(c)}
                    onClick={() => setOpen(false)}
                    title={c.label}
                    className={`group flex h-[45px] items-center gap-3 px-[18px] text-[13.5px] font-semibold transition-colors hover:bg-gray-50 hover:text-blue-700
                      ${isActive ? "text-blue-700" : "text-gray-800"}`}
                  >
                    <Icon size={19} className="shrink-0" />
                    <span
                      className={`flex-1 whitespace-nowrap transition-opacity duration-200 ${
                        expanded ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      {c.label}
                    </span>
                    {c.children && expanded && (
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
            <h3 className="mb-4 text-[13px] font-bold uppercase tracking-wide text-gray-900">
              {active.label}
            </h3>
            <ul className="space-y-3">
              {active.children.map((child) => (
                <li key={child}>
                  <Link
                    href={`/category/${slugify(child)}`}
                    onClick={() => setOpen(false)}
                    className="text-sm text-gray-500 transition-colors hover:text-blue-700"
                  >
                    {child}
                  </Link>
                </li>
              ))}
            </ul>

            {active.promo && (
              <Link
                href={active.promo.href}
                onClick={() => setOpen(false)}
                className="mt-6 block overflow-hidden rounded-lg bg-gradient-to-b from-[#0b1230] to-[#1d3fa8] text-center text-white"
              >
                <div className="px-4 pt-6">
                  <p className="text-xs uppercase tracking-wider text-white/70">{active.promo.tag}</p>
                  <p className="mt-2 text-lg font-bold">{active.promo.title}</p>
                  <span className="mt-4 inline-block rounded bg-blue-600 px-4 py-2 text-xs font-semibold">
                    {active.promo.cta}
                  </span>
                </div>
                <div className="relative mt-4 h-56">
                  <Image
                    src={active.promo.image}
                    alt={active.promo.title}
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