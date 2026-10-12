// src/components/frontend/ShopByCategory.jsx
"use client";

import React from "react";
import Link from "next/link";
import { categories } from "@/data/homeData";

// Continuously moving (marquee) category strip. Pauses on hover / touch.
export default function ShopByCategory({ speed = 40 }) {
  // duplicate the list so the loop is seamless (translateX 0 -> -50%)
  const loop = [...categories, ...categories];

  return (
    <section className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
      <h2 className="mb-5 text-2xl font-bold text-gray-900">Shop By Category</h2>

      <div className="nx-marquee relative overflow-hidden">
        <div className="nx-marquee-track flex w-max gap-4" style={{ animationDuration: `${speed}s` }}>
          {loop.map((c, i) => (
            <Link
              key={`${c.id}-${i}`}
              href={c.href}
              aria-hidden={i >= categories.length}
              tabIndex={i >= categories.length ? -1 : 0}
              className="group w-[154px] shrink-0 text-center"
            >
              <div className="flex h-[154px] items-center justify-center overflow-hidden rounded-xl bg-white p-3 shadow-sm transition-shadow group-hover:shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.image}
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
