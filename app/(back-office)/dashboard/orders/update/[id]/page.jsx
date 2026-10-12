// Route: /dashboard/orders/update/[id]
// File: src/app/(backoffice)/dashboard/orders/update/[id]/page.jsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import OrderForm from "@/components/backoffice/OrderForm";
import { makeGetRequest } from "@/lib/apiRequest";

export default function UpdateOrder() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      const data = await makeGetRequest(`/api/orders/${id}`);
      setOrder(data);
      setLoading(false);
    }
    if (id) loadOrder();
  }, [id]);

  if (loading) {
    return <p className="p-6 text-center">Loading order...</p>;
  }

  if (!order) {
    return <p className="p-6 text-center">Order not found</p>;
  }

  if (order.status === "CANCELLED") {
    return <p className="p-6 text-center">Cancelled orders can't be edited</p>;
  }

  return <OrderForm order={order} />;
}
