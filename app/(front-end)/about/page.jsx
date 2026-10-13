// src/app/(frontend)/about/page.jsx
import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CreditCard,
  Headphones,
  Laptop,
  MapPin,
  Phone,
  ShieldCheck,
  Truck,
  Wallet,
  Wrench,
} from "lucide-react";
import SiteShell from "@/components/frontend/SiteShell";
import PageBanner from "@/components/frontend/PageBanner";
import { SITE, CATEGORIES } from "@/lib/siteConfig";

export const metadata = {
  title: "About Us",
  description: `${SITE.name} – ${SITE.tagline}. Find us at ${SITE.location}.`,
};

const services = [
  {
    icon: Laptop,
    title: "Sales",
    text: "Laptops, desktops, smartphones, monitors and accessories from trusted brands, all genuine.",
    href: "/products",
    cta: "Browse products",
  },
  {
    icon: Wrench,
    title: "Repair",
    text: "Cracked screens, slow machines, battery and keyboard faults. Our technicians diagnose and fix them.",
    href: "/contact",
    cta: "Book a repair",
  },
  {
    icon: ShieldCheck,
    title: "Maintenance",
    text: "Cleaning, upgrades, software setup and regular check-ups to keep your devices running well.",
    href: "/contact",
    cta: "Ask about maintenance",
  },
];

const values = [
  { icon: BadgeCheck, title: "Genuine products", text: "Every item is sourced from trusted brands and checked before it ships." },
  { icon: Truck, title: "Fast delivery", text: `Quick delivery in Kampala and across Uganda. Free delivery on orders above ${SITE.freeDeliveryMin}.` },
  { icon: Wallet, title: "Fair prices", text: "Competitive prices in UGX with no hidden charges at checkout." },
  { icon: Headphones, title: "Real support", text: "Friendly people who help you pick the right device and sort out any issue." },
];

// TODO: replace with your real numbers
const stats = [
  { value: "1,000+", label: "Products" },
  { value: "50+", label: "Brands" },
  { value: "10k+", label: "Happy customers" },
  { value: "3-in-1", label: "Sales, repair & care" },
];

const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(SITE.address)}&output=embed`;

export default function AboutPage() {
  const categories = CATEGORIES.filter((c) => c.slug !== "all-products");

  return (
    <SiteShell>
      <PageBanner title="About Us" subtitle={SITE.tagline} />

      <section className="mx-auto max-w-[1400px] space-y-10 px-4 py-10 sm:px-6">
        {/* Who we are + location card */}
        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-10">
            <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-green-700">
              Who we are
            </span>
            <h2 className="mt-4 text-2xl font-bold text-gray-900 sm:text-3xl">{SITE.name}</h2>
            <p className="mt-1 text-sm text-gray-500">{SITE.dealers}</p>
            <div className="mt-5 space-y-4 leading-relaxed text-gray-600">
              {SITE.seo.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>

          <aside className="flex flex-col justify-between rounded-2xl bg-gradient-to-br from-green-700 to-green-500 p-6 text-white shadow-sm sm:p-8">
            <div>
              <h3 className="text-xl font-bold">Visit our shop</h3>
              <p className="mt-4 flex items-start gap-3 text-green-50">
                <MapPin size={18} className="mt-0.5 shrink-0" />
                <span>
                  {SITE.shop}, {SITE.location}
                </span>
              </p>
              <div className="mt-4 space-y-2">
                {SITE.phones.map((p) => (
                  <a key={p.href} href={p.href} className="flex items-center gap-3 text-green-50 hover:text-white">
                    <Phone size={18} className="shrink-0" />
                    <span className="font-medium">{p.label}</span>
                  </a>
                ))}
              </div>
            </div>
            <Link
              href="/contact"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-green-700 transition hover:bg-green-50"
            >
              Get in touch <ArrowRight size={16} />
            </Link>
          </aside>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl bg-white p-6 text-center shadow-sm">
              <p className="text-3xl font-bold text-green-600">{s.value}</p>
              <p className="mt-1 text-sm text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Services */}
        <div>
          <h2 className="mb-4 text-2xl font-bold text-gray-900">What we do</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {services.map(({ icon: Icon, title, text, href, cta }) => (
              <div
                key={title}
                className="group flex flex-col rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 transition group-hover:bg-green-600 group-hover:text-white">
                  <Icon size={22} />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-500">{text}</p>
                <Link href={href} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-green-700 hover:underline">
                  {cta} <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Why shop with us */}
        <div>
          <h2 className="mb-4 text-2xl font-bold text-gray-900">Why shop with us</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {values.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl bg-white p-6 shadow-sm">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <Icon size={20} />
                </span>
                <h3 className="mt-4 font-semibold text-gray-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Shop by category + payments */}
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold text-gray-900">What we stock</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/category/${c.slug}`}
                  className="rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-700 transition hover:border-green-600 hover:bg-green-50 hover:text-green-700"
                >
                  {c.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
            <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
              <CreditCard size={20} className="text-green-600" /> Ways to pay
            </h2>
            <ul className="mt-4 space-y-2">
              {SITE.payments.map((p) => (
                <li key={p} className="flex items-center gap-2 text-sm text-gray-600">
                  <BadgeCheck size={16} className="text-green-600" /> {p}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Map */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-900">Find us</h2>
            <p className="mt-1 text-sm text-gray-500">{SITE.address}</p>
          </div>
          <iframe
            title="Green Planet Computers location"
            src={mapSrc}
            className="h-72 w-full border-0 sm:h-96"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center justify-between gap-4 rounded-2xl bg-green-700 p-8 text-white sm:flex-row">
          <div>
            <h3 className="text-xl font-bold">Need help choosing?</h3>
            <p className="mt-1 text-green-100">Talk to our team and get a recommendation that fits your budget.</p>
          </div>
          <Link href="/contact" className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-green-700 hover:bg-green-50">
            Contact Us
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}