// Route: /dashboard/payments/update/[id]
// File: src/app/(backoffice)/dashboard/payments/update/[id]/page.jsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PaymentForm from "@/components/backoffice/PaymentForm";
import { makeGetRequest } from "@/lib/apiRequest";

export default function UpdatePayment() {
  const { id } = useParams();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPayment() {
      const data = await makeGetRequest(`/api/payments/${id}`);
      setPayment(data);
      setLoading(false);
    }
    if (id) loadPayment();
  }, [id]);

  if (loading) {
    return <p className="p-6 text-center">Loading payment...</p>;
  }

  if (!payment) {
    return <p className="p-6 text-center">Payment not found</p>;
  }

  return <PaymentForm payment={payment} />;
}
