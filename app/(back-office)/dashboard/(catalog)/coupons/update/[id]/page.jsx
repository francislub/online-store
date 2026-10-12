// Route: /dashboard/coupons/update/[id]
// File: src/app/(backoffice)/dashboard/coupons/update/[id]/page.jsx
"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useParams, useRouter } from "next/navigation";
import FormHeader from "@/components/backoffice/FormHeader";
import TextInput from "@/components/FormInputs/TextInput";
import SubmitButton from "@/components/FormInputs/SubmitButton";
import ToggleInput from "@/components/FormInputs/ToggleInput";
import { makeGetRequest, makePutRequest } from "@/lib/apiRequest";
import { generateIsoFormattedDate, toDateInputValue } from "@/lib/generateIsoFormattedDate";

export default function UpdateCoupon() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [couponCode, setCouponCode] = useState("");

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    async function loadCoupon() {
      const coupon = await makeGetRequest(`/api/coupons/${id}`);
      if (coupon) {
        setCouponCode(coupon.couponCode);
        reset({
          title: coupon.title,
          expiryDate: toDateInputValue(coupon.expiryDate),
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          minOrderTotal: coupon.minOrderTotal,
          usageLimit: coupon.usageLimit ?? "",
          isActive: coupon.isActive,
        });
      }
      setFetching(false);
    }
    if (id) loadCoupon();
  }, [id, reset]);

  function redirect() {
    router.push("/dashboard/coupons");
  }

  async function onSubmit(data) {
    const payload = {
      title: data.title,
      discountType: data.discountType,
      discountValue: Number(data.discountValue),
      minOrderTotal: Number(data.minOrderTotal) || 0,
      usageLimit: data.usageLimit ? Number(data.usageLimit) : null,
      expiryDate: generateIsoFormattedDate(data.expiryDate),
      isActive: data.isActive,
    };

    makePutRequest(setLoading, `/api/coupons/${id}`, payload, "Coupon", redirect);
  }

  if (fetching) {
    return <p className="p-6 text-center">Loading coupon...</p>;
  }

  return (
    <div>
      <FormHeader title="Update Coupon" />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mx-auto my-3 w-full max-w-4xl rounded-lg border border-gray-200 bg-white p-4 shadow dark:border-gray-700 dark:bg-gray-800 sm:p-6 md:p-8"
      >
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Coupon code: <span className="font-semibold">{couponCode}</span> (cannot be changed)
        </p>

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
          buttonTitle="Update Coupon"
          loadingButtonTitle="Updating Coupon please wait..."
        />
      </form>
    </div>
  );
}