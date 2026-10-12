// src/components/frontend/SiteFooter.jsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { SITE, FOOTER_LINKS } from "@/lib/siteConfig";
import { BrandLogo } from "./SiteHeader";

const SOCIAL_PATHS = {
  facebook: "M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H7.9v3h2.6V21h3z",
  instagram: "M12 7.3A4.7 4.7 0 1 0 12 16.7 4.7 4.7 0 0 0 12 7.3zm0 7.7a3 3 0 1 1 0-6 3 3 0 0 1 0 6zM17.2 6.1a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2zM12 3.2c-2.4 0-2.7 0-3.6.1-2.5.1-3.9 1.5-4 4C4.3 8.2 4.3 8.5 4.3 12s0 3.8.1 4.7c.1 2.5 1.5 3.9 4 4 .9.1 1.2.1 3.6.1s2.7 0 3.6-.1c2.5-.1 3.9-1.5 4-4 .1-.9.1-1.2.1-4.7s0-3.8-.1-4.7c-.1-2.5-1.5-3.9-4-4-.9-.1-1.2-.1-3.6-.1z",
  tiktok: "M16.6 3h-2.8v12.2a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.8a5.5 5.5 0 1 0 4.6 5.4V9.3a6.7 6.7 0 0 0 3.9 1.2V7.7A3.9 3.9 0 0 1 16.6 3z",
};
const SOCIAL_BG = { facebook: "bg-[#1f4e9c]", instagram: "bg-[#7a3f2e]", tiktok: "bg-black" };

const PAY_STYLE = {
  "Cash on Delivery": "bg-sky-500 text-white",
  "MTN Mobile Money": "bg-yellow-400 text-black",
  "Airtel Money": "bg-red-600 text-white",
  "Bank Transfer": "bg-white text-sky-700 border border-gray-300",
};

export default function SiteFooter() {
  const [more, setMore] = useState(false);

  return (
    <footer className="mt-10">
      {/* SEO / about block */}
      <div className="bg-gray-100 px-4 pb-6">
        <div className="mx-auto max-w-[1280px] rounded-xl bg-white p-6 text-[15px] leading-7 text-gray-600 shadow-sm">
          <div className={`relative overflow-hidden transition-all duration-500 ${more ? "max-h-[600px]" : "max-h-[76px]"}`}>
            {SITE.seo.map((p, idx) => (
              <p key={idx} className="mb-3">{p}</p>
            ))}
            {!more && <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent" />}
          </div>
          <button
            onClick={() => setMore(!more)}
            className="mt-3 flex items-center gap-2 rounded-md bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-200"
          >
            {more ? "Read Less" : "Read More"}
            <ChevronDown size={15} className={`transition-transform ${more ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* columns */}
      <div className="bg-white">
        <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr_1.3fr]">
          <div>
            <BrandLogo />
            <h4 className="mt-5 text-lg font-bold text-gray-900">Follow Us</h4>
            <div className="mt-3 flex gap-2">
              {SITE.socials.map((s) => (
                <a
                  key={s.key}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.label}
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:-translate-y-0.5 hover:opacity-90 ${SOCIAL_BG[s.key]}`}
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d={SOCIAL_PATHS[s.key]} /></svg>
                </a>
              ))}
            </div>
            <p className="mt-4 text-[15px] text-gray-600">{SITE.tagline}</p>
          </div>

          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-lg font-bold text-gray-900">{title}</h4>
              <ul className="mt-4 space-y-3">
                {links.map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="text-sm text-gray-500 transition hover:text-blue-700">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="text-lg font-bold text-gray-900">Contact Info</h4>
            <ul className="mt-4 space-y-3 text-sm text-gray-600">
              <li>
                Phone:{" "}
                {SITE.phones.map((p, i) => (
                  <span key={p.href}>
                    {i > 0 && " | "}
                    <a href={p.href} className="hover:text-blue-700">{p.label}</a>
                  </span>
                ))}
              </li>
              <li>Address: {SITE.shop}, {SITE.location}</li>
              <li className="text-xs text-gray-400">{SITE.dealers}</li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              {SITE.payments.map((p) => (
                <span key={p} className={`rounded px-2 py-1 text-[10px] font-bold ${PAY_STYLE[p]}`}>{p}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200">
          <p className="mx-auto max-w-[1100px] px-4 py-6 text-center text-sm leading-6 text-gray-500">
            © {new Date().getFullYear()} {SITE.name}. All rights reserved. {SITE.legal}
          </p>
        </div>
      </div>
    </footer>
  );
}