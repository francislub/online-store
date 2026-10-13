// src/components/frontend/ShopByCategory.jsx
// Route: / (home page, "Shop By Category" strip)
"use client";

import React from "react";
import Link from "next/link";
import { useHomeData } from "@/lib/useHomeData";

const PLACEHOLDER = "/images/placeholder.png";

function CategorySkeleton() {
  return (
    <section className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
      <div className="mb-5 h-8 w-56 animate-pulse rounded bg-gray-200" />
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="w-[154px] shrink-0">
            <div className="h-[154px] animate-pulse rounded-xl bg-gray-200" />
            <div className="mx-auto mt-3 h-4 w-24 animate-pulse rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </section>
  );
}

// Continuously moving (marquee) category strip. Pauses on hover / touch.
export default function ShopByCategory({ speed = 40 }) {
  const { data, loading } = useHomeData();

  if (loading) return <CategorySkeleton />;

  const categories = data?.categories || [];
  if (categories.length === 0) return null;

  // repeat short lists so the strip always fills the width
  const base = Array.from({ length: Math.ceil(8 / categories.length) }, () => categories).flat();
  // duplicate the list so the loop is seamless (translateX 0 -> -50%)
  const loop = [...base, ...base];

  return (
    <section className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
      <h2 className="mb-5 text-2xl font-bold text-gray-900">Shop By Category</h2>

      <div className="nx-marquee relative overflow-hidden">
        <div className="nx-marquee-track flex w-max gap-4" style={{ animationDuration: `${speed}s` }}>
          {loop.map((c, i) => (
            <Link
              key={`${c.id}-${i}`}
              href={c.href}
              aria-hidden={i >= base.length}
              tabIndex={i >= base.length ? -1 : 0}
              className="group w-[154px] shrink-0 text-center"
            >
              <div className="flex h-[154px] items-center justify-center overflow-hidden rounded-xl bg-white p-3 shadow-sm transition-shadow group-hover:shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.image || PLACEHOLDER}
                  alt={c.name}
                  loading="lazy"
                  className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <h3 className="mt-3 text-[17px] font-semibold leading-snug text-gray-800 group-hover:text-blue-600">
                {c.name}
              </h3>
              <p className="mt-1 text-sm text-gray-500">{c.count} products</p>
            </Link>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes nx-marquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(calc(-50% - 8px));
          }
        }
        .nx-marquee-track {
          animation-name: nx-marquee;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        .nx-marquee:hover .nx-marquee-track,
        .nx-marquee:active .nx-marquee-track {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .nx-marquee-track {
            animation: none;
          }
          .nx-marquee {
            overflow-x: auto;
          }
        }
      `}</style>
    </section>
  );
}