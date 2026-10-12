// Route: /dashboard/products/update/[id]
// File: src/app/(backoffice)/dashboard/products/update/[id]/page.jsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ProductForm from "@/components/backoffice/ProductForm";
import { makeGetRequest } from "@/lib/apiRequest";

export default function UpdateProduct() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProduct() {
      const data = await makeGetRequest(`/api/products/${id}`);
      setProduct(data);
      setLoading(false);
    }
    if (id) loadProduct();
  }, [id]);

  if (loading) {
    return <p className="p-6 text-center">Loading product...</p>;
  }

  if (!product) {
    return <p className="p-6 text-center">Product not found</p>;
  }

  return <ProductForm product={product} />;
}