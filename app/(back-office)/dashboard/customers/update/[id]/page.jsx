// Route: /dashboard/customers/update/[id]
// File: app/(back-office)/dashboard/customers/update/[id]/page.jsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import CustomerForm from "@/components/backoffice/CustomerForm";
import { makeGetRequest } from "@/lib/apiRequest";

export default function UpdateCustomer() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCustomer() {
      const data = await makeGetRequest(`/api/customers/${id}`);
      setCustomer(data);
      setLoading(false);
    }
    if (id) loadCustomer();
  }, [id]);

  if (loading) {
    return <p className="p-6 text-center">Loading customer...</p>;
  }

  if (!customer) {
    return <p className="p-6 text-center">Customer not found</p>;
  }

  return <CustomerForm customer={customer} />;
}