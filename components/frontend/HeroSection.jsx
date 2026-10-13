// src/components/frontend/HeroSection.jsx
// Route: / (home page storefront hero)
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

const INTERVAL = 5000;

function Banner({ b, className = "", small = false }) {
  return (
    <div className={`group relative overflow-hidden rounded-xl bg-gray-800 ${className}`}>
      <Image
        src={b.imageUrl}
        alt={b.title}
        fill
        sizes="(min-width:1024px) 40vw, 100vw"
        className="object-cover transition duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
      <div className={`relative flex h-full flex-col justify-center ${small ? "p-5" : "p-8"} text-white`}>
        <h3 className={`font-bold leading-tight ${small ? "text-xl" : "text-3xl"}`}>{b.title}</h3>
        <Link
          href={b.link || "/products"}
          className={`mt-3 w-fit rounded-md font-semibold transition ${
            small
              ? "bg-white px-4 py-2 text-xs text-gray-900 hover:bg-blue-600 hover:text-white"
              : "bg-blue-600 px-5 py-2.5 text-sm hover:bg-blue-700"
          }`}
        >
          {b.ctaLabel || (small ? "View Details" : "Shop Now")}
        </Link>
      </div>
    </div>
  );
}

function HeroSkeleton() {
  return (
    <section className="mx-auto grid max-w-[1280px] gap-4 px-4 pt-4 lg:grid-cols-2">
      <div className="h-[300px] animate-pulse rounded-xl bg-gray-200 sm:h-[400px] lg:h-[460px]" />
      <div className="grid gap-4 lg:h-[460px] lg:grid-rows-[3fr_2fr]">
        <div className="h-[200px] animate-pulse rounded-xl bg-gray-200 lg:h-auto" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-[160px] animate-pulse rounded-xl bg-gray-200 lg:h-auto" />
          <div className="h-[160px] animate-pulse rounded-xl bg-gray-200 lg:h-auto" />
        </div>
      </div>
    </section>
  );
}

export default function HeroSection() {
  const [banners, setBanners] = useState(null); // null = loading
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef(null);

  // fetch active banners from the database (public endpoint)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/banners?active=true", { cache: "no-store" });
        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error(json?.message || "Failed to load banners");
        if (!cancelled) setBanners(Array.isArray(json?.data) ? json.data : []);
      } catch (err) {
        console.log("[HeroSection]", err);
        if (!cancelled) setBanners([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const slides = (banners || []).filter((b) => b.placement === "SLIDER");
  const top = (banners || []).find((b) => b.placement === "TOP");
  const bottom = (banners || []).filter((b) => b.placement === "BOTTOM").slice(0, 2);
  const n = slides.length;

  const go = useCallback((d) => setI((v) => (n ? (v + d + n) % n : 0)), [n]);

  useEffect(() => {
    if (paused || n < 2) return;
    const t = setInterval(() => go(1), INTERVAL);
    return () => clearInterval(t);
  }, [paused, go, n]);

  if (banners === null) return <HeroSkeleton />;
  if (!slides.length && !top && !bottom.length) return null;

  return (
    <section className="mx-auto grid max-w-[1280px] gap-4 px-4 pt-4 lg:grid-cols-2">
      {/* moving slider */}
      {n > 0 && (
        <div
          className="group relative h-[300px] overflow-hidden rounded-xl bg-gray-900 sm:h-[400px] lg:h-[460px]"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
            touchX.current = null;
          }}
        >
          {slides.map((s, idx) => (
            <div
              key={s.id}
              aria-hidden={idx !== i}
              className={`absolute inset-0 transition-opacity duration-700 ${
                idx === i ? "z-10 opacity-100" : "opacity-0"
              }`}
            >
              <Image
                src={s.imageUrl}
                alt={s.title}
                fill
                priority={idx === 0}
                sizes="(min-width:1024px) 50vw, 100vw"
                className={`object-cover transition-transform duration-[6000ms] ease-out ${
                  idx === i ? "scale-110" : "scale-100"
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/10 to-transparent" />
              <div
                className={`absolute inset-x-0 top-0 flex flex-col items-center px-6 pt-10 text-center text-white transition-all duration-700 delay-200 ${
                  idx === i ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                }`}
              >
                <h2 className="text-3xl font-extrabold tracking-wide sm:text-4xl">{s.title}</h2>
                {s.subtitle && <p className="mt-2 text-sm text-white/90">{s.subtitle}</p>}
                <Link
                  href={s.link || "/products"}
                  className="mt-4 rounded-md bg-blue-600 px-6 py-2.5 text-sm font-semibold shadow-lg transition hover:bg-blue-700"
                >
                  {s.ctaLabel || "Shop Now"}
                </Link>
              </div>
            </div>
          ))}

          {n > 1 && (
            <>
              {/* arrows */}
              {[-1, 1].map((d) => (
                <button
                  key={d}
                  onClick={() => go(d)}
                  aria-label={d < 0 ? "Previous slide" : "Next slide"}
                  className={`absolute top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-gray-900 opacity-0 shadow transition hover:bg-white group-hover:opacity-100 ${
                    d < 0 ? "left-3" : "right-3"
                  }`}
                >
                  {d < 0 ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                </button>
              ))}

              {/* dots */}
              <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/80 px-3 py-1.5">
                {slides.map((s, idx) => (
                  <button
                    key={s.id}
                    onClick={() => setI(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                    className={`h-2.5 rounded-full transition-all ${
                      idx === i ? "w-6 bg-gray-800" : "w-2.5 bg-gray-400 hover:bg-gray-600"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* right banners */}
      {(top || bottom.length > 0) && (
        <div className="grid gap-4 lg:h-[460px] lg:grid-rows-[3fr_2fr]">
          {top && <Banner b={top} className="h-[200px] lg:h-auto" />}
          {bottom.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {bottom.map((b) => (
                <Banner key={b.id} b={b} small className="h-[160px] lg:h-auto" />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}