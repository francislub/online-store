// src/app/(frontend)/checkout/page.jsx
// Route: /checkout
import React from "react";
import PageBanner from "@/components/frontend/PageBanner";
import CheckoutView from "@/components/frontend/CheckoutView";

export const metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <>
      <PageBanner title="Checkout" />
      <section className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6">
        <CheckoutView />
      </section>
    </>
  );
}