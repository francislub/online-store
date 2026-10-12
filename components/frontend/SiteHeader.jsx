// src/components/frontend/SiteHeader.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search, Phone, ArrowUpRight, User, Shuffle, Heart, ShoppingCart,
  ChevronDown, Menu,
} from "lucide-react";
import { SITE, NAV, MEGA_CARDS, CATEGORIES, slugify } from "@/lib/siteConfig";

export function BrandLogo({ className = "" }) {
  return (
    <Link href="/" aria-label={SITE.name} className={`flex items-center gap-3 ${className}`}>
      <Image
        src={SITE.logo}
        alt={SITE.name}
        width={52}
        height={52}
        priority
        className="h-[52px] w-[52px] rounded-full object-cover"
      />
      <span className="leading-none">
        <span className="block text-[22px] font-extrabold tracking-wide text-[#3f6212]">{SITE.shortName}</span>
        <span className="mt-1 block text-[12px] font-bold tracking-[0.38em] text-gray-900">COMPUTERS</span>
      </span>
    </Link>
  );
}

function SearchBox({ compact = false }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [focus, setFocus] = useState(false);
  const ref = useRef(null);

  const pool = useMemo(() => {
    const all = [];
    CATEGORIES.forEach((c) => {
      all.push({ label: c.label, href: c.href ?? `/category/${c.slug}`, type: "Category" });
      (c.children ?? []).forEach((ch) =>
        all.push({ label: ch, href: `/category/${slugify(ch)}`, type: c.label })
      );
    });
    return all;
  }, []);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s.length < 2) return [];
    return pool.filter((p) => p.label.toLowerCase().includes(s)).slice(0, 6);
  }, [q, pool]);

  useEffect(() => {
    const out = (e) => ref.current && !ref.current.contains(e.target) && setFocus(false);
    document.addEventListener("mousedown", out);
    return () => document.removeEventListener("mousedown", out);
  }, []);

  const submit = (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    setFocus(false);
    router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <form ref={ref} onSubmit={submit} className="relative w-full">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setFocus(true)}
        placeholder="Search for products"
        className={`w-full rounded-full border border-gray-200 bg-white pl-5 pr-14 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
          compact ? "h-9" : "h-11"
        }`}
      />
      <button
        type="submit"
        aria-label="Search"
        className={`absolute right-0 top-0 flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 ${
          compact ? "h-9 w-9" : "h-11 w-11"
        }`}
      >
        <Search size={17} />
      </button>

      {focus && results.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-xl">
          {results.map((r) => (
            <li key={r.href}>
              <Link
                href={r.href}
                onClick={() => setFocus(false)}
                className="flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-50"
              >
                <span className="font-medium text-gray-800">{r.label}</span>
                <span className="text-xs text-gray-400">{r.type}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}

function IconButton({ children, count, href, label }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-900 transition hover:scale-105 hover:bg-gray-100"
    >
      {children}
      {count !== undefined && (
        <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border border-gray-200 bg-white px-1 text-[10px] font-semibold text-blue-600">
          {count}
        </span>
      )}
    </Link>
  );
}

export default function SiteHeader({ onOpenCategories, counts }) {
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(null);
  const closeTimer = useRef(null);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 90);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const openMenu = (key) => { clearTimeout(closeTimer.current); setMenu(key); };
  const closeMenu = () => { closeTimer.current = setTimeout(() => setMenu(null), 120); };

  return (
    <header className="relative h-[156px] lg:h-[140px]">
      <style>{`@keyframes navSlide{from{transform:translateY(-100%)}to{transform:translateY(0)}}`}</style>

      {/* ABOVE HEADER – disappears once the page scrolls */}
      <div
        className={`absolute inset-x-0 top-0 h-[104px] bg-white transition-all duration-200 lg:h-[84px] ${
          scrolled ? "pointer-events-none -translate-y-2 opacity-0" : "opacity-100"
        }`}
      >
        <div className="mx-auto flex h-full max-w-[1280px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2 lg:flex-nowrap lg:py-0">
          <div className="flex flex-1 items-center justify-between lg:flex-none">
            <BrandLogo />
            <button
              onClick={onOpenCategories}
              aria-label="Open menu"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white lg:hidden"
            >
              <Menu size={20} />
            </button>
          </div>

          <div className="order-last w-full lg:order-none lg:max-w-[540px] lg:flex-1">
            <SearchBox />
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            <Phone size={30} strokeWidth={2.4} className="text-gray-900" />
            <div className="leading-tight">
              <p className="text-[13px] font-bold uppercase text-gray-900">Call to order</p>
              <div className="text-[13px] text-blue-600">
                {SITE.phones.map((p, i) => (
                  <span key={p.href}>
                    {i > 0 && <span className="text-gray-400"> | </span>}
                    <a href={p.href} className="hover:underline">{p.label}</a>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="hidden items-center gap-3 xl:flex">
            <ArrowUpRight size={30} strokeWidth={2.4} className="text-gray-900" />
            <div className="leading-tight">
              <p className="text-[13px] font-bold text-gray-900">Free Delivery</p>
              <span className="text-[13px] text-blue-600">Orders Above {SITE.freeDeliveryMin.replace("USh", "UShs")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* RED NAV – becomes fixed on scroll */}
      <nav
        onMouseLeave={closeMenu}
        className={`z-40 bg-[#3f6212] text-white ${
          scrolled
            ? "fixed inset-x-0 top-0 shadow-lg lg:left-14"
            : "absolute inset-x-0 top-[104px] lg:top-[84px]"
        }`}
        style={scrolled ? { animation: "navSlide .25s ease-out" } : undefined}
      >
        <div className="mx-auto flex h-[52px] max-w-[1280px] items-center gap-4 px-4">
          <button
            onClick={onOpenCategories}
            className="flex h-10 items-center gap-2 rounded-full bg-white px-3 pr-4 text-[13px] font-semibold text-gray-900 transition hover:bg-gray-100"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#3f6212] text-white">
              <Menu size={15} />
            </span>
            All Categories
          </button>

          {scrolled && (
            <div className="hidden w-64 xl:block"><SearchBox compact /></div>
          )}

          <ul className="hidden flex-1 items-center lg:flex">
            {NAV.map((item, i) => (
              <li
                key={item.label}
                onMouseEnter={() => (item.menu ? openMenu(item.label) : setMenu(null))}
                className={`relative px-3 ${i > 0 ? "border-l border-white/30" : ""}`}
              >
                <Link
                  href={item.href ?? "#"}
                  className={`flex items-center gap-1 text-[13px] font-semibold transition hover:text-white ${
                    item.label === "Popular Categories" ? "text-white/70" : ""
                  }`}
                >
                  {item.label}
                  {item.menu && (
                    <ChevronDown
                      size={11}
                      className={`transition-transform ${menu === item.label ? "rotate-180" : ""}`}
                    />
                  )}
                </Link>

                {item.menu === "list" && menu === item.label && (
                  <ul className="absolute left-0 top-full z-50 mt-[7px] w-56 rounded-b-lg bg-white py-2 text-gray-800 shadow-xl">
                    {item.items.map((s) => (
                      <li key={s}>
                        <Link
                          href={`/category/${slugify(s)}`}
                          onClick={() => setMenu(null)}
                          className="block px-4 py-2 text-sm hover:bg-gray-50 hover:text-blue-700"
                        >
                          {s}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>

          <div className="ml-auto flex items-center gap-2">
            <IconButton href="/account" label="Account"><User size={18} /></IconButton>
            <IconButton href="/compare" label="Compare" count={counts.compare}><Shuffle size={17} /></IconButton>
            <IconButton href="/wishlist" label="Wishlist" count={counts.wishlist}><Heart size={17} /></IconButton>
            <Link
              href="/cart"
              aria-label="Cart"
              className="relative flex h-10 items-center gap-2 rounded-full bg-blue-600 pl-3 pr-4 text-[13px] font-semibold text-white transition hover:bg-blue-700"
            >
              <ShoppingCart size={18} />
              <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-blue-600">
                {counts.cart}
              </span>
              <span className="hidden sm:inline">UGX {counts.total.toLocaleString()}</span>
            </Link>
          </div>
        </div>

        {/* Popular Categories mega panel */}
        {menu === "Popular Categories" && (
          <div
            onMouseEnter={() => openMenu("Popular Categories")}
            className="absolute inset-x-0 top-full z-50 bg-white shadow-2xl"
          >
            <div className="mx-auto grid max-w-[1280px] grid-cols-3 gap-5 p-7">
              {MEGA_CARDS.map((c) => (
                <Link
                  key={c.label}
                  href={c.href}
                  onClick={() => setMenu(null)}
                  className="group relative block h-[280px] overflow-hidden rounded-xl bg-gray-200"
                >
                  <Image
                    src={c.image}
                    alt={c.label}
                    fill
                    sizes="400px"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <span className="absolute bottom-5 left-7 text-2xl font-bold uppercase tracking-wide text-white">
                    {c.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}