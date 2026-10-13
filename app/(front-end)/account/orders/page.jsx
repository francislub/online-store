// src/app/(frontend)/account/orders/page.jsx
// Route: /account/orders
import React from "react";
import PageBanner from "@/components/frontend/PageBanner";
import OrdersList from "@/components/frontend/OrdersList";

export const metadata = { title: "My Orders" };

export default function MyOrdersPage() {
  return (
    <>
      <PageBanner title="My Orders" />
      <section className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6">
        <OrdersList />
      </section>
    </>
  );
}