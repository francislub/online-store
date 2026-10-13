// src/components/frontend/BluetoothSection.jsx
import React from "react";
import Link from "next/link";
import { ArrowRight, Footprints, Home, PartyPopper, Tent } from "lucide-react";
import { bluetooth } from "@/data/homeData";
import SafeImage from "./SafeImage";

const ICONS = { party: PartyPopper, indoor: Home, outdoor: Tent, mini: Footprints };

export default function BluetoothSection() {
  return (
    <section className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-5">
        {/* hero card */}
        <div className="grid items-center gap-4 overflow-hidden rounded-xl bg-white p-4 sm:p-6 md:grid-cols-[1fr_1.1fr]">
          <div className="overflow-hidden rounded-xl bg-blue-50">
            <SafeImage
              src={bluetooth.image}
              alt={bluetooth.title}
              loading="eager"
              className="max-h-[320px] w-full object-contain"
            />
          </div>
          <div>
            <h2 className="text-5xl font-bold leading-tight text-gray-900 sm:text-6xl">
              {bluetooth.title}
            </h2>
            <p className="mt-4 text-gray-500">{bluetooth.subtitle}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {bluetooth.chips.map((c) => {
                const Icon = ICONS[c.icon] || PartyPopper;
                return (
                  <Link
                    key={c.label}
                    href={c.href}
                    className="flex items-center gap-2 rounded-md bg-gray-100 px-4 py-2.5 text-xs font-bold tracking-wide text-gray-800 transition-colors hover:bg-blue-100 hover:text-blue-700"
                  >
                    <Icon size={14} /> {c.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* three tiles */}
        <div className="grid gap-4 sm:grid-cols-3">
          {bluetooth.tiles.map((t) => (
            <Link
              key={t.subtitle}
              href={t.href}
              className="group relative flex h-44 items-end overflow-hidden rounded-xl bg-gray-800 text-white"
            >
              <SafeImage
                src={t.image}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/30 to-transparent" />
              <div className="relative p-5">
                <h3 className="text-lg font-bold">{t.title}</h3>
                <p className="text-sm text-white/80">{t.subtitle}</p>
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                  View Details
                  <ArrowRight
                    size={14}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}