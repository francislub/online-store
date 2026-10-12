// Route: /dashboard/coupons/new
// File: src/app/(backoffice)/dashboard/coupons/new/page.jsx
"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import FormHeader from "@/components/backoffice/FormHeader";
import TextInput from "@/components/FormInputs/TextInput";
import SubmitButton from "@/components/FormInputs/SubmitButton";
import ToggleInput from "@/components/FormInputs/ToggleInput";
import { makePostRequest } from "@/lib/apiRequest";
import { generateCouponCode } from "@/lib/generateCouponCode";
import { generateIsoFormattedDate } from "@/lib/generateIsoFormattedDate";

export default function NewCoupon() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      isActive: true,
      discountType: "PERCENTAGE",
      minOrderTotal: 0,
    },
  });

  function redirect() {
    router.push("/dashboard/coupons");
  }

  async function onSubmit(data) {
    const payload = {
      title: data.title,
      couponCode: generateCouponCode(data.title, data.expiryDate),
      discountType: data.discountType,
      discountValue: Number(data.discountValue),
      minOrderTotal: Number(data.minOrderTotal) || 0,
      usageLimit: data.usageLimit ? Number(data.usageLimit) : null,
      expiryDate: generateIsoFormattedDate(data.expiryDate),
      isActive: data.isActive,
    };

    makePostRequest(setLoading, "/api/coupons", payload, "Coupon", reset, redirect);
  }

  return (
    <div>
      <FormHeader title="New Coupon" />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mx-auto my-3 w-full max-w-4xl rounded-lg border border-gray-200 bg-white p-4 shadow dark:border-gray-700 dark:bg-gray-800 sm:p-6 md:p-8"
      >
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
          <TextInput label="Coupon Title" name="title" register={register} errors={errors} className="w-full" />
          <TextInput
            label="Coupon Expiry Date"
            name="expiryDate"
            type="date"
            register={register}
            errors={errors}
            className="w-full"
          />

          <div className="w-full">
            <label htmlFor="discountType" className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
              Discount Type
            </label>
            <select
              id="discountType"
              {...register("discountType", { required: true })}
              className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-lime-500 focus:ring-lime-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FIXED">Fixed amount (UGX)</option>
            </select>
          </div>

          <TextInput
            label="Discount Value"
            name="discountValue"
            type="number"
            register={register}
            errors={errors}
            className="w-full"
          />
          <TextInput
            label="Minimum Order Total (UGX)"
            name="minOrderTotal"
            type="number"
            isRequired={false}
            register={register}
            errors={errors}
            className="w-full"
          />
          <TextInput
            label="Usage Limit (optional)"
            name="usageLimit"
            type="number"
            isRequired={false}
            register={register}
            errors={errors}
            className="w-full"
          />

          <ToggleInput
            label="Publish Your Coupon"
            name="isActive"
            trueTitle="Active"
            falseTitle="InActive"
            register={register}
          />
        </div>

        <SubmitButton
          isLoading={loading}
          buttonTitle="Create Coupon"
          loadingButtonTitle="Creating Coupon please wait..."
        />
      </form>
    </div>
  );
}