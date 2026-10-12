// Route: /dashboard/quotes/update/[id]
// File: src/app/(backoffice)/dashboard/quotes/update/[id]/page.jsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import QuoteForm from "@/components/backoffice/QuoteForm";
import { makeGetRequest } from "@/lib/apiRequest";

export default function UpdateQuote() {
  const { id } = useParams();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadQuote() {
      const data = await makeGetRequest(`/api/quotes/${id}`);
      setQuote(data);
      setLoading(false);
    }
    if (id) loadQuote();
  }, [id]);

  if (loading) {
    return <p className="p-6 text-center">Loading quote...</p>;
  }

  if (!quote) {
    return <p className="p-6 text-center">Quote not found</p>;
  }

  if (quote.status === "CONVERTED") {
    return <p className="p-6 text-center">Converted quotes can't be edited</p>;
  }

  return <QuoteForm quote={quote} />;
}
