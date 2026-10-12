// Route: /dashboard/suppliers/update/[id]
// File: src/app/(backoffice)/dashboard/suppliers/update/[id]/page.jsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import SupplierForm from "@/components/backoffice/SupplierForm";
import { makeGetRequest } from "@/lib/apiRequest";

export default function UpdateSupplier() {
  const { id } = useParams();
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSupplier() {
      const data = await makeGetRequest(`/api/suppliers/${id}`);
      setSupplier(data);
      setLoading(false);
    }
    if (id) loadSupplier();
  }, [id]);

  if (loading) {
    return <p className="p-6 text-center">Loading supplier...</p>;
  }

  if (!supplier) {
    return <p className="p-6 text-center">Supplier not found</p>;
  }

  return <SupplierForm supplier={supplier} />;
}