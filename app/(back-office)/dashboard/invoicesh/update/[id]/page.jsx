// Route: /dashboard/invoices/update/[id]
// File: src/app/(backoffice)/dashboard/invoices/update/[id]/page.jsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import InvoiceForm from "@/components/backoffice/InvoiceForm";
import { makeGetRequest } from "@/lib/apiRequest";

export default function UpdateInvoice() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInvoice() {
      const data = await makeGetRequest(`/api/invoices/${id}`);
      setInvoice(data);
      setLoading(false);
    }
    if (id) loadInvoice();
  }, [id]);

  if (loading) {
    return <p className="p-6 text-center">Loading invoice...</p>;
  }

  if (!invoice) {
    return <p className="p-6 text-center">Invoice not found</p>;
  }

  if (["PAID", "VOID"].includes(invoice.status)) {
    return <p className="p-6 text-center">This invoice is {invoice.status.toLowerCase()} and can no longer be edited.</p>;
  }

  return <InvoiceForm invoice={invoice} />;
}