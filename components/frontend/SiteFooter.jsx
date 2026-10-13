// src/components/frontend/SiteFooter.jsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUp,
  Banknote,
  ChevronDown,
  Headset,
  Landmark,
  MapPin,
  Navigation,
  Phone,
  ShieldCheck,
  Smartphone,
  Truck,
  Wrench,
} from "lucide-react";
import { SITE, FOOTER_LINKS } from "@/lib/siteConfig";

/* Only these columns are shown. "Store Policy" is intentionally not rendered. */
const COLUMNS = [
  { title: "Categories", links: FOOTER_LINKS["Categories"] ?? [] },
  { title: "Useful Links", links: FOOTER_LINKS["Useful Links"] ?? [] },
];

const TRUST = [
  { icon: Truck, title: "Free Delivery", text: `Orders above ${SITE.freeDeliveryMin.replace("USh", "UShs")}` },
  { icon: ShieldCheck, title: "Genuine Products", text: "Warranty-backed service" },
  { icon: Wrench, title: "Repair & Maintenance", text: "Laptops & computers" },
  { icon: Headset, title: "Call To Order", text: SITE.phones.map((p) => p.label).join(" | ") },
];

/* ---------- larger footer logo ---------- */
function FooterLogo() {
  return (
    <Link href="/" aria-label={SITE.name} className="inline-flex items-center gap-4">
      <Image
        src={SITE.logo}
        alt={SITE.name}
        width={96}
        height={96}
        className="h-20 w-20 rounded-full object-cover shadow-md sm:h-24 sm:w-24"
      />
      <span className="leading-none">
        <span className="block text-[28px] font-extrabold tracking-wide text-[#3f6212] sm:text-[32px]">
          {SITE.shortName}
        </span>
        <span className="mt-1.5 block text-[14px] font-bold tracking-[0.38em] text-gray-900 sm:text-[16px]">
          COMPUTERS
        </span>
      </span>
    </Link>
  );
}

/* ---------- brand icons (inline SVG so no icon-library dependency) ---------- */
function SocialIcon({ name }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", "aria-hidden": true };
  if (name === "facebook")
    return (
      <svg {...common} fill="currentColor">
        <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z" />
      </svg>
    );
  if (name === "instagram")
    return (
      <svg {...common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  if (name === "tiktok")
    return (
      <svg {...common} fill="currentColor">
        <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.6 2.6 0 0 1 0-5.2c.27 0 .53.04.77.12V9.66a5.7 5.7 0 0 0-.77-.05 5.69 5.69 0 1 0 5.69 5.69V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.3 4.3 0 0 1-3.25-1.48z" />
      </svg>
    );
  return null;
}

function paymentIcon(label) {
  const l = label.toLowerCase();
  if (l.includes("cash")) return { Icon: Banknote, color: "text-emerald-600" };
  if (l.includes("mtn")) return { Icon: Smartphone, color: "text-yellow-500" };
  if (l.includes("airtel")) return { Icon: Smartphone, color: "text-red-600" };
  if (l.includes("bank")) return { Icon: Landmark, color: "text-blue-600" };
  return { Icon: Banknote, color: "text-gray-500" };
}

/* ---------- link column: accordion on mobile, always open on desktop ---------- */
function FooterColumn({ title, links }) {
  const [open, setOpen] = useState(false);
  const id = `footer-col-${title.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div className="border-b border-gray-200 lg:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={id}
        className="flex w-full items-center justify-between py-4 text-left lg:pointer-events-none lg:cursor-default lg:py-0"
      >
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">{title}</h3>
        <ChevronDown
          size={16}
          className={`text-gray-500 transition-transform lg:hidden ${open ? "rotate-180" : ""}`}
        />
      </button>

      <ul id={id} className={`${open ? "block" : "hidden"} space-y-2.5 pb-4 lg:block lg:pb-0 lg:pt-5`}>
        {links.map(([label, href]) => (
          <li key={href}>
            <Link
              href={href}
              className="group inline-flex items-center gap-1.5 text-sm text-gray-600 transition-colors hover:text-[#3f6212]"
            >
              <ArrowRight
                size={12}
                className="-ml-4 opacity-0 transition-all group-hover:ml-0 group-hover:opacity-100"
              />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- main footer ---------- */
export default function SiteFooter() {
  const [showTop, setShowTop] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  useEffect(() => {
    const on = () => setShowTop(window.scrollY > 500);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SITE.address)}`;
  const year = new Date().getFullYear();

  return (
    <footer className="mt-10 bg-gray-50 text-gray-700">
      {/* 1. trust strip */}
      <div className="border-y border-gray-200 bg-white">
        <ul className="mx-auto grid max-w-[1280px] grid-cols-2 gap-px bg-gray-200 lg:grid-cols-4">
          {TRUST.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex items-center gap-3 bg-white px-4 py-5 sm:px-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#3f6212]/10 text-[#3f6212]">
                <Icon size={22} />
              </span>
              <div className="min-w-0 leading-tight">
                <p className="text-sm font-bold text-gray-900">{title}</p>
                <p className="truncate text-xs text-gray-500">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* 2. main columns */}
      <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:py-14">
        <div className="grid gap-x-10 gap-y-2 lg:grid-cols-[1.5fr_1fr_1fr_1.4fr] lg:gap-y-8">
          {/* brand */}
          <div className="pb-6 lg:pb-0">
            <FooterLogo />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-gray-600">{SITE.tagline}</p>

            <div className="mt-5 flex items-center gap-2.5">
              {SITE.socials.map((s) => (
                <a
                  key={s.key}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  title={s.label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition hover:-translate-y-0.5 hover:border-[#3f6212] hover:bg-[#3f6212] hover:text-white"
                >
                  <SocialIcon name={s.key} />
                </a>
              ))}
            </div>
          </div>

          {COLUMNS.map((c) => (
            <FooterColumn key={c.title} title={c.title} links={c.links} />
          ))}

          {/* contact */}
          <div className="pt-6 lg:pt-0">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">Visit Us</h3>
            <ul className="mt-5 space-y-4 text-sm">
              <li className="flex gap-3">
                <MapPin size={18} className="mt-0.5 shrink-0 text-[#3f6212]" />
                <div>
                  <p className="font-semibold text-gray-900">{SITE.shop}</p>
                  <p className="text-gray-600">{SITE.location}</p>
                  <p className="text-gray-600">Kampala, Uganda</p>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline"
                  >
                    <Navigation size={12} /> Get directions
                  </a>
                </div>
              </li>
              <li className="flex gap-3">
                <Phone size={18} className="mt-0.5 shrink-0 text-[#3f6212]" />
                <div className="flex flex-col gap-0.5">
                  {SITE.phones.map((p) => (
                    <a key={p.href} href={p.href} className="text-gray-700 hover:text-blue-600 hover:underline">
                      {p.label}
                    </a>
                  ))}
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* 3. payments + about */}
        <div className="mt-10 grid gap-8 border-t border-gray-200 pt-8 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">We Accept</h3>
            <ul className="mt-4 flex flex-wrap gap-2">
              {SITE.payments.map((p) => {
                const { Icon, color } = paymentIcon(p);
                return (
                  <li
                    key={p}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm"
                  >
                    <Icon size={15} className={color} />
                    {p}
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">
              About {SITE.name}
            </h3>
            {/* all paragraphs stay in the DOM (good for SEO); the box just clips them */}
            <div
              className={`relative mt-4 space-y-3 overflow-hidden text-sm leading-relaxed text-gray-600 transition-[max-height] duration-500 ${
                aboutOpen ? "max-h-[600px]" : "max-h-[84px]"
              }`}
            >
              {SITE.seo.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
              {!aboutOpen && (
                <span className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-gray-50 to-transparent" />
              )}
            </div>
            <button
              type="button"
              onClick={() => setAboutOpen((o) => !o)}
              aria-expanded={aboutOpen}
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
            >
              {aboutOpen ? "Show less" : "Read more"}
              <ChevronDown size={13} className={`transition-transform ${aboutOpen ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 4. bottom bar */}
      <div className="bg-[#2b4309] text-white/80">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-2 px-4 py-5 text-xs sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <p>
            © {year} <span className="font-semibold text-white">{SITE.name}</span>. All rights reserved.
          </p>
          <p className="max-w-3xl leading-relaxed text-white/60 lg:text-right">{SITE.legal}</p>
        </div>
      </div>

      {/* back to top */}
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
        className={`fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#3f6212] text-white shadow-xl transition-all duration-300 hover:-translate-y-1 hover:bg-[#2b4309] ${
          showTop ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <ArrowUp size={20} />
      </button>
    </footer>
  );
}