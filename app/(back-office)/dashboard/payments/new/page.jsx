// Route: /dashboard/payments/new  (optional ?orderId=... to pre-select an order)
// File: src/app/(backoffice)/dashboard/payments/new/page.jsx
"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PaymentForm from "@/components/backoffice/PaymentForm";

function NewPaymentContent() {
  const searchParams = useSearchParams();
  return <PaymentForm presetOrderId={searchParams.get("orderId")} />;
}

export default function NewPayment() {
  return (
    <Suspense fallback={<p className="p-6 text-center">Loading...</p>}>
      <NewPaymentContent />
    </Suspense>
  );
}
