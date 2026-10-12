// src/app/(frontend)/contact/page.jsx
import React from "react";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import SiteShell from "@/components/frontend/SiteShell";
import PageBanner from "@/components/frontend/PageBanner";
import ContactForm from "@/components/frontend/ContactForm";

export const metadata = { title: "Contact Us" };

// TODO: replace with your real business details
const info = [
  { icon: Phone, label: "Phone", value: "+256 700 000 000" },
  { icon: Mail, label: "Email", value: "info@yourstore.com" },
  { icon: MapPin, label: "Address", value: "Kampala, Uganda" },
  { icon: Clock, label: "Opening hours", value: "Mon - Sat: 8:00 AM - 7:00 PM" },
];

export default function ContactPage() {
  return (
    <SiteShell>
      <PageBanner title="Contact Us" subtitle="Questions about an order or a product? Send us a message and we will respond quickly." />
      <section className="mx-auto grid max-w-[1400px] gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          {info.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-4 rounded-xl bg-white p-5 shadow-sm">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <Icon size={20} />
              </span>
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="font-semibold text-gray-900">{value}</p>
              </div>
            </div>
          ))}
        </div>
        <ContactForm />
      </section>
    </SiteShell>
  );
}
