// components/backoffice/SupplierForm.jsx
// Route: n/a (shared form used by /dashboard/suppliers/new and /dashboard/suppliers/update/[id])
"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import FormHeader from "@/components/backoffice/FormHeader";
import TextInput from "@/components/FormInputs/TextInput";
import TextareaInput from "@/components/FormInputs/TextAreasInput";
import ToggleInput from "@/components/FormInputs/ToggleInput";
import SubmitButton from "@/components/FormInputs/SubmitButton";
import { makePostRequest, makePutRequest } from "@/lib/apiRequest";

export default function SupplierForm({ supplier = null }) {
  const isEdit = Boolean(supplier);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: supplier?.name ?? "",
      contactName: supplier?.contactName ?? "",
      phone: supplier?.phone ?? "",
      email: supplier?.email ?? "",
      address: supplier?.address ?? "",
      balance: supplier?.balance ?? 0,
      isActive: supplier?.isActive ?? true,
    },
  });

  function redirect() {
    router.push("/dashboard/suppliers");
  }

  async function onSubmit(data) {
    const payload = {
      name: data.name,
      contactName: data.contactName,
      phone: data.phone,
      email: data.email,
      address: data.address,
      balance: Number(data.balance) || 0,
      isActive: data.isActive,
    };

    if (isEdit) {
      makePutRequest(setLoading, `/api/suppliers/${supplier.id}`, payload, "Supplier", redirect);
    } else {
      makePostRequest(setLoading, "/api/suppliers", payload, "Supplier", reset, redirect);
    }
  }

  return (
    <div>
      <FormHeader title={isEdit ? "Update Supplier" : "New Supplier"} />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mx-auto my-3 w-full max-w-4xl rounded-lg border border-gray-200 bg-white p-4 shadow dark:border-gray-700 dark:bg-gray-800 sm:p-6 md:p-8"
      >
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
          <TextInput label="Supplier Name" name="name" register={register} errors={errors} className="w-full" />
          <TextInput
            label="Contact Person"
            name="contactName"
            isRequired={false}
            register={register}
            errors={errors}
            className="w-full"
          />
          <TextInput
            label="Phone"
            name="phone"
            isRequired={false}
            register={register}
            errors={errors}
            className="w-full"
          />
          <TextInput
            label="Email"
            name="email"
            type="email"
            isRequired={false}
            register={register}
            errors={errors}
            className="w-full"
          />
          <TextInput
            label="Balance owed to supplier (UGX)"
            name="balance"
            type="number"
            isRequired={false}
            register={register}
            errors={errors}
            className="w-full"
          />
          <TextareaInput
            label="Address"
            name="address"
            isRequired={false}
            register={register}
            errors={errors}
          />
          <ToggleInput
            label="Supplier Status"
            name="isActive"
            trueTitle="Active"
            falseTitle="InActive"
            register={register}
          />
        </div>

        <SubmitButton
          isLoading={loading}
          buttonTitle={isEdit ? "Update Supplier" : "Create Supplier"}
          loadingButtonTitle={isEdit ? "Updating Supplier please wait..." : "Creating Supplier please wait..."}
        />
      </form>
    </div>
  );
}