// Route: /dashboard/returns/new  (optional ?orderId=... to pre-select an order)
// File: src/app/(backoffice)/dashboard/returns/new/page.jsx
"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ReturnForm from "@/components/backoffice/ReturnForm";

function NewReturnContent() {
  const searchParams = useSearchParams();
  return <ReturnForm presetOrderId={searchParams.get("orderId")} />;
}

export default function NewReturn() {
  return (
    <Suspense fallback={<p className="p-6 text-center">Loading...</p>}>
      <NewReturnContent />
    </Suspense>
  );
}
