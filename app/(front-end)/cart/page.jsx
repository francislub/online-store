// src/app/(frontend)/cart/page.jsx
import React from "react";
import SiteShell from "@/components/frontend/SiteShell";
import PageBanner from "@/components/frontend/PageBanner";
import CartView from "@/components/frontend/CartView";

export const metadata = { title: "Cart" };

export default function CartPage() {
  return (
    <SiteShell>
      <PageBanner title="Shopping Cart" />
      <section className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6">
        <CartView />
      </section>
    </SiteShell>
  );
}
