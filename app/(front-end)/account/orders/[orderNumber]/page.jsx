// src/app/(frontend)/account/orders/[orderNumber]/page.jsx
// Route: /account/orders/:orderNumber
import React, { Suspense } from "react";
import PageBanner from "@/components/frontend/PageBanner";
import OrderDetail from "@/components/frontend/OrderDetail";

export const metadata = { title: "Order Details" };

export default async function OrderPage({ params }) {
  const { orderNumber } = await params;
  return (
    <>
      <PageBanner title="Order Details" />
      <section className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6">
        <Suspense fallback={null}>
          <OrderDetail orderNumber={orderNumber} />
        </Suspense>
      </section>
    </>
  );
}