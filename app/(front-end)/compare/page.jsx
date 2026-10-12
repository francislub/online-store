// src/app/(frontend)/compare/page.jsx
import React from "react";
import Link from "next/link";
import { Shuffle } from "lucide-react";
import SiteShell from "@/components/frontend/SiteShell";
import PageBanner from "@/components/frontend/PageBanner";

export const metadata = { title: "Compare Products" };

// TODO: when you add a compare store, render a spec table here.
export default function ComparePage() {
  return (
    <SiteShell>
      <PageBanner title="Compare Products" subtitle="Put products side by side to find the best fit." />
      <section className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6">
        <div className="flex flex-col items-center rounded-xl bg-white p-12 text-center shadow-sm">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <Shuffle size={28} />
          </span>
          <h2 className="mt-5 text-xl font-semibold text-gray-900">Nothing to compare yet</h2>
          <p className="mt-2 max-w-md text-gray-500">Add products to compare and their specs and prices will show up here.</p>
          <Link href="/" className="mt-6 rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700">
            Browse Products
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
