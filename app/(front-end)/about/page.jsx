// src/app/(frontend)/about/page.jsx
import React from "react";
import Link from "next/link";
import { BadgeCheck, Headphones, Truck, Wallet } from "lucide-react";
import SiteShell from "@/components/frontend/SiteShell";
import PageBanner from "@/components/frontend/PageBanner";

export const metadata = { title: "About Us" };

const values = [
  { icon: BadgeCheck, title: "Genuine products", text: "Every item is sourced from trusted brands and checked before it ships." },
  { icon: Truck, title: "Fast delivery", text: "Quick delivery in Kampala and across Uganda, with free shipping on bigger orders." },
  { icon: Wallet, title: "Fair prices", text: "Competitive prices in UGX with no hidden charges at checkout." },
  { icon: Headphones, title: "Real support", text: "Friendly people who can help you pick the right device and sort out any issue." },
];

const stats = [
  { value: "1,000+", label: "Products" },
  { value: "50+", label: "Brands" },
  { value: "10k+", label: "Happy customers" },
  { value: "24/7", label: "Online ordering" },
];

export default function AboutPage() {
  return (
    <SiteShell>
      <PageBanner title="About Us" subtitle="Your trusted store for laptops, PC hardware, accessories and audio." />

      <section className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6">
        <div className="rounded-xl bg-white p-6 shadow-sm sm:p-10">
          <h2 className="text-2xl font-bold text-gray-900">Who we are</h2>
          {/* TODO: replace with your real story */}
          <p className="mt-4 max-w-3xl leading-relaxed text-gray-600">
            We are an electronics store built to make buying technology simple. From gaming laptops and monitors to
            PC components, power banks and Bluetooth speakers, we stock genuine products from well-known brands and
            back them with honest advice and reliable after-sales support.
          </p>
          <p className="mt-4 max-w-3xl leading-relaxed text-gray-600">
            Whether you are building your first PC, upgrading your workspace or looking for the right gift, our team is
            here to help you choose with confidence.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl bg-white p-6 text-center shadow-sm">
              <p className="text-3xl font-bold text-blue-600">{s.value}</p>
              <p className="mt-1 text-sm text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>

        <h2 className="mb-4 mt-10 text-2xl font-bold text-gray-900">Why shop with us</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {values.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-xl bg-white p-6 shadow-sm">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <Icon size={20} />
              </span>
              <h3 className="mt-4 font-semibold text-gray-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">{text}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-xl bg-blue-600 p-8 text-white sm:flex-row">
          <div>
            <h3 className="text-xl font-bold">Need help choosing?</h3>
            <p className="mt-1 text-blue-100">Talk to our team and get a recommendation that fits your budget.</p>
          </div>
          <Link href="/contact" className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-50">
            Contact Us
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
