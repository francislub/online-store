// Route: /dashboard/purchases/update/[id]
// File: src/app/(backoffice)/dashboard/purchases/update/[id]/page.jsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PurchaseForm from "@/components/backoffice/PurchaseForm";
import { makeGetRequest } from "@/lib/apiRequest";

export default function UpdatePurchase() {
  const { id } = useParams();
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPurchase() {
      const data = await makeGetRequest(`/api/purchases/${id}`);
      setPurchase(data);
      setLoading(false);
    }
    if (id) loadPurchase();
  }, [id]);

  if (loading) {
    return <p className="p-6 text-center">Loading purchase...</p>;
  }

  if (!purchase) {
    return <p className="p-6 text-center">Purchase not found</p>;
  }

  if (!["DRAFT", "ORDERED"].includes(purchase.status)) {
    return <p className="p-6 text-center">This purchase is {purchase.status.toLowerCase()} and can no longer be edited.</p>;
  }

  return <PurchaseForm purchase={purchase} />;
}