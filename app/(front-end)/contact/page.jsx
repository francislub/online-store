// src/app/(frontend)/contact/page.jsx
import React from "react";
import { ChevronDown, Clock, MapPin, MessageCircle, Phone, Share2, Store } from "lucide-react";
import SiteShell from "@/components/frontend/SiteShell";
import PageBanner from "@/components/frontend/PageBanner";
import ContactForm from "@/components/frontend/ContactForm";
import { SITE } from "@/lib/siteConfig";

export const metadata = {
  title: "Contact Us",
  description: `Call, visit or message ${SITE.name}. ${SITE.address}.`,
};

// TODO: add `hours` to SITE in siteConfig.js if you want it editable there
const HOURS = SITE.hours ?? "Mon - Sat: 8:00 AM - 7:00 PM";

const whatsappNumber = SITE.phones[0].href.replace("tel:+", "");
const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
  `Hello ${SITE.name}, I would like to make an enquiry.`
)}`;
const mapQuery = encodeURIComponent(SITE.address);
const mapSrc = `https://www.google.com/maps?q=${mapQuery}&output=embed`;
const directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${mapQuery}`;

const faqs = [
  {
    q: "Do you repair laptops and computers?",
    a: "Yes. We offer professional repair and maintenance for laptops and desktops. Visit the shop or call us to book.",
  },
  {
    q: "Where are you located?",
    a: `${SITE.shop}, ${SITE.location}.`,
  },
  {
    q: "How can I pay?",
    a: `We accept ${SITE.payments.join(", ")}.`,
  },
  {
    q: "Do you offer free delivery?",
    a: `Yes, delivery is free on orders above ${SITE.freeDeliveryMin}.`,
  },
  {
    q: "Are your products genuine?",
    a: "Yes. We sell genuine products from multiple brands, with warranty-backed service.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ComputerStore",
  name: SITE.name,
  description: SITE.tagline,
  address: { "@type": "PostalAddress", streetAddress: `${SITE.shop}, ${SITE.location}`, addressLocality: "Kampala", addressCountry: "UG" },
  telephone: SITE.phones.map((p) => p.label),
};

function InfoCard({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-4 rounded-2xl bg-white p-5 shadow-sm">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
        <Icon size={20} />
      </span>
      <div className="min-w-0">
        <p className="text-sm text-gray-500">{label}</p>
        <div className="font-semibold text-gray-900">{children}</div>
      </div>
    </div>
  );
}

export default function ContactPage() {
  return (
    <SiteShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <PageBanner
        title="Contact Us"
        subtitle="Questions about an order, a product or a repair? Call, visit or send us a message."
      />

      <section className="mx-auto max-w-[1400px] space-y-8 px-4 py-10 sm:px-6">
        {/* Quick actions */}
        <div className="grid gap-3 sm:grid-cols-3">
          <a
            href={SITE.phones[0].href}
            className="flex items-center justify-center gap-2 rounded-xl bg-green-700 px-5 py-3.5 font-semibold text-white transition hover:bg-green-800"
          >
            <Phone size={18} /> Call {SITE.phones[0].label}
          </a>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3.5 font-semibold text-white transition hover:bg-emerald-600"
          >
            <MessageCircle size={18} /> WhatsApp us
          </a>
          <a
            href={directionsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3.5 font-semibold text-gray-800 transition hover:border-green-600 hover:text-green-700"
          >
            <MapPin size={18} /> Get directions
          </a>
        </div>

        {/* Info + form */}
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <div className="space-y-4">
            <InfoCard icon={Phone} label="Phone">
              <div className="space-y-1">
                {SITE.phones.map((p) => (
                  <a key={p.href} href={p.href} className="block hover:text-green-700">
                    {p.label}
                  </a>
                ))}
              </div>
            </InfoCard>

            <InfoCard icon={Store} label="Shop">
              {SITE.shop}
            </InfoCard>

            <InfoCard icon={MapPin} label="Address">
              <span className="font-semibold">{SITE.location}, Kampala, Uganda</span>
            </InfoCard>

            <InfoCard icon={Clock} label="Opening hours">
              {HOURS}
            </InfoCard>

            <InfoCard icon={Share2} label="Follow us">
              <div className="mt-1 flex flex-wrap gap-2">
                {SITE.socials.map((s) => (
                  <a
                    key={s.key}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-gray-200 px-3 py-1 text-sm font-medium text-gray-700 transition hover:border-green-600 hover:bg-green-50 hover:text-green-700"
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            </InfoCard>
          </div>

          <ContactForm />
        </div>

        {/* Map */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <iframe
            title="Green Planet Computers location"
            src={mapSrc}
            className="h-72 w-full border-0 sm:h-96"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        {/* FAQ */}
        <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-bold text-gray-900">Quick answers</h2>
          <div className="mt-4 divide-y divide-gray-100">
            {faqs.map(({ q, a }) => (
              <details key={q} className="group py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-gray-900 [&::-webkit-details-marker]:hidden">
                  {q}
                  <ChevronDown size={18} className="shrink-0 text-gray-400 transition group-open:rotate-180" />
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}