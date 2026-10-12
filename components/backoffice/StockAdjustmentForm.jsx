// components/backoffice/StockAdjustmentForm.jsx
// Route: n/a (used by /dashboard/stock-movements/new)
"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import FormHeader from "@/components/backoffice/FormHeader";
import TextInput from "@/components/FormInputs/TextInput";
import TextareaInput from "@/components/FormInputs/TextAreasInput";
import SelectInput from "@/components/FormInputs/SelectInput";
import SubmitButton from "@/components/FormInputs/SubmitButton";
import { makeGetRequest, makePostRequest } from "@/lib/apiRequest";

const TYPE_OPTIONS = [
  { id: "ADJUSTMENT", title: "Adjustment (use + or - quantity)" },
  { id: "DAMAGED", title: "Damaged / lost (stock out)" },
  { id: "OPENING", title: "Opening balance (stock in)" },
];

export default function StockAdjustmentForm() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loading, setLoading] = useState(false);

  const {
    register,
    reset,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: { productId: "", type: "ADJUSTMENT", quantity: "", reference: "", notes: "" },
  });

  const selectedId = watch("productId");
  const selected = products.find((p) => p.id === selectedId);

  useEffect(() => {
    async function loadProducts() {
      const data = await makeGetRequest("/api/products");
      setProducts(Array.isArray(data) ? data : []);
      setLoadingProducts(false);
    }
    loadProducts();
  }, []);

  function redirect() {
    router.push("/dashboard/stock-movements");
  }

  async function onSubmit(data) {
    makePostRequest(
      setLoading,
      "/api/stock-movements",
      {
        productId: data.productId,
        type: data.type,
        quantity: Number(data.quantity),
        reference: data.reference,
        notes: data.notes,
      },
      "Stock movement",
      reset,
      redirect
    );
  }

  if (loadingProducts) return <p className="p-6 text-center">Loading form...</p>;

  const productOptions = products.map((p) => ({ id: p.id, title: `${p.name} (${p.sku})` }));

  return (
    <div>
      <FormHeader title="New Stock Movement" />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mx-auto my-3 w-full max-w-4xl rounded-lg border border-gray-200 bg-white p-4 shadow dark:border-gray-700 dark:bg-gray-800 sm:p-6 md:p-8"
      >
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
          <SelectInput
            label="Select Product"
            name="productId"
            register={register}
            errors={errors}
            className="w-full"
            options={productOptions}
          />
          <SelectInput
            label="Movement Type"
            name="type"
            register={register}
            errors={errors}
            className="w-full"
            options={TYPE_OPTIONS}
          />
          <TextInput label="Quantity" name="quantity" type="number" register={register} errors={errors} className="w-full" />
          <TextInput
            label="Reference"
            name="reference"
            isRequired={false}
            register={register}
            errors={errors}
            className="w-full"
          />
          {selected && (
            <p className="text-sm text-gray-600 dark:text-gray-300 sm:col-span-2">
              Current stock for <span className="font-semibold">{selected.name}</span>:{" "}
              <span className="font-semibold">{selected.stock}</span>
            </p>
          )}
          <TextareaInput label="Notes" name="notes" isRequired={false} register={register} errors={errors} />
        </div>

        <SubmitButton
          isLoading={loading}
          buttonTitle="Record Movement"
          loadingButtonTitle="Saving movement please wait..."
        />
      </form>
    </div>
  );
}