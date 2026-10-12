// src/components/frontend/LaptopsSection.jsx
import React from "react";
import Link from "next/link";
import SectionHeader from "./SectionHeader";
import ProductCard from "./ProductCard";
import { laptops, laptopPromo } from "@/data/homeData";

export default function LaptopsSection() {
  return (
    <section className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        {/* promo banner */}
        <div className="relative hidden min-h-[460px] overflow-hidden rounded-xl bg-gradient-to-b from-[#12053d] via-fuchsia-600 to-orange-500 text-center text-white lg:block">
          <div className="p-6 pt-8">
            <p className="text-sm tracking-widest text-white/70">{laptopPromo.tag}</p>
            <h3 className="mt-2 text-2xl font-bold">{laptopPromo.title}</h3>
            <Link
              href={laptopPromo.href}
              className="mt-5 inline-block rounded-md bg-blue-600 px-6 py-2.5 text-sm font-semibold hover:bg-blue-700"
            >
              {laptopPromo.cta}
            </Link>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={laptopPromo.image}
            alt={laptopPromo.title}
            className="absolute -bottom-4 left-1/2 w-[110%] max-w-none -translate-x-1/2 rotate-[-8deg] object-contain"
          />
        </div>

        <div>
          <SectionHeader title="Laptops" href="/category/laptops-desktops" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {laptops.map((p) => (
              <ProductCard key={p.id} product={p} showSku showBrand />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
