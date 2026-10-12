// src/app/(frontend)/wishlist/page.jsx
import React from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import SiteShell from "@/components/frontend/SiteShell";
import PageBanner from "@/components/frontend/PageBanner";

export const metadata = { title: "Wishlist" };

// TODO: when you add a wishlist store, render the saved products here.
export default function WishlistPage() {
  return (
    <SiteShell>
      <PageBanner title="Wishlist" subtitle="Products you have saved for later." />
      <section className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6">
        <div className="flex flex-col items-center rounded-xl bg-white p-12 text-center shadow-sm">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <Heart size={28} />
          </span>
          <h2 className="mt-5 text-xl font-semibold text-gray-900">Your wishlist is empty</h2>
          <p className="mt-2 max-w-md text-gray-500">Tap the heart on any product to save it here.</p>
          <Link href="/" className="mt-6 rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700">
            Continue Shopping
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
