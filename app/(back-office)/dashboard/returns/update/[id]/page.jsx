// Route: /dashboard/returns/update/[id]
// File: src/app/(backoffice)/dashboard/returns/update/[id]/page.jsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ReturnForm from "@/components/backoffice/ReturnForm";
import { makeGetRequest } from "@/lib/apiRequest";

export default function UpdateReturn() {
  const { id } = useParams();
  const [ret, setRet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReturn() {
      const data = await makeGetRequest(`/api/returns/${id}`);
      setRet(data);
      setLoading(false);
    }
    if (id) loadReturn();
  }, [id]);

  if (loading) {
    return <p className="p-6 text-center">Loading return...</p>;
  }

  if (!ret) {
    return <p className="p-6 text-center">Return not found</p>;
  }

  if (!["REQUESTED", "APPROVED"].includes(ret.status)) {
    return <p className="p-6 text-center">This return is already being processed and can't be edited</p>;
  }

  return <ReturnForm ret={ret} />;
}
