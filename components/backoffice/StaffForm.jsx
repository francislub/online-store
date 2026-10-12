// components/backoffice/StaffForm.jsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import AuthInput from "@/components/FormInputs/AuthInput";
import SubmitButton from "@/components/FormInputs/SubmitButton";
import { makePostRequest, makePutRequest } from "@/lib/apiRequest";
import { STAFF_ROLE_OPTIONS, STAFF_ROLE_MAP } from "./staffRoles";

export default function StaffForm({ initialData = null, isSelf = false }) {
  const router = useRouter();
  const isEdit = Boolean(initialData);
  const [loading, setLoading] = useState(false);

  const {
    register,
    reset,
    watch,
    getValues,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      role: initialData?.role || "CASHIER",
      isActive: initialData ? initialData.isActive : true,
      password: "",
      confirmPassword: "",
    },
  });

  const isActive = watch("isActive");
  const role = watch("role");

  function goBack() {
    router.push("/dashboard/staff");
    router.refresh();
  }

  async function onSubmit(data) {
    const { confirmPassword, ...rest } = data;
    const payload = { ...rest, isActive: Boolean(rest.isActive) };

    if (isEdit && !payload.password) delete payload.password;

    if (isSelf) {
      payload.role = initialData.role;
      payload.isActive = initialData.isActive;
    }

    if (isEdit) {
      await makePutRequest(setLoading, `api/staff/${initialData.id}`, payload, "Staff", goBack);
    } else {
      await makePostRequest(setLoading, "api/staff", payload, "Staff", reset, goBack);
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mx-auto my-3 w-full max-w-4xl rounded-lg border border-gray-200 bg-white p-4 shadow dark:border-gray-700 dark:bg-gray-800 sm:p-6 md:p-8"
    >
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
        <AuthInput
          label="Staff Full Name"
          name="name"
          register={register}
          errors={errors}
          autoComplete="off"
          placeholder="John Doe"
          rules={{ required: "Full name is required", minLength: { value: 2, message: "Name is too short" } }}
        />

        <AuthInput
          label="Email Address"
          name="email"
          type="email"
          register={register}
          errors={errors}
          autoComplete="off"
          placeholder="name@example.com"
          rules={{
            required: "Email is required",
            pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email address" },
          }}
        />

        <AuthInput
          label="Phone Number (optional)"
          name="phone"
          type="tel"
          register={register}
          errors={errors}
          autoComplete="off"
          placeholder="+256 700 000000"
          rules={{
            pattern: { value: /^[+0-9\s-]{9,15}$/, message: "Enter a valid phone number" },
          }}
        />

        <div>
          <label
            htmlFor="role"
            className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
          >
            Staff Role
          </label>
          <select
            id="role"
            disabled={isSelf}
            {...register("role", { required: "Select a role" })}
            className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-lime-600 focus:ring-2 focus:ring-lime-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            {STAFF_ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <small className="mt-1 block text-gray-500 dark:text-gray-400">
            {STAFF_ROLE_MAP[isSelf ? initialData.role : role]?.description}
          </small>
        </div>

        <AuthInput
          label={isEdit ? "New Password (leave blank to keep current)" : "Password"}
          name="password"
          type="password"
          register={register}
          errors={errors}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          rules={{
            required: isEdit ? false : "Password is required",
            minLength: { value: 8, message: "Password must be at least 8 characters" },
          }}
        />

        <AuthInput
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          register={register}
          errors={errors}
          autoComplete="new-password"
          placeholder="Repeat the password"
          rules={{
            required: isEdit ? false : "Please confirm the password",
            validate: (value) => value === getValues("password") || "Passwords do not match",
          }}
        />

        <div className="sm:col-span-2">
          <p className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Account Status</p>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              disabled={isSelf}
              className="peer sr-only"
              {...register("isActive")}
            />
            <div className="h-6 w-11 rounded-full bg-gray-300 transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-lime-600 peer-checked:after:translate-x-5 peer-focus:ring-4 peer-focus:ring-lime-300 peer-disabled:cursor-not-allowed peer-disabled:opacity-60 dark:bg-gray-600 dark:peer-focus:ring-lime-800" />
            <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
              {isActive ? "Active, can sign in" : "Inactive, cannot sign in"}
            </span>
          </label>
          {isSelf && (
            <small className="mt-1 block text-gray-500 dark:text-gray-400">
              You cannot change your own role or deactivate your own account.
            </small>
          )}
        </div>
      </div>

      <div className="mt-6">
        <SubmitButton
          isLoading={loading}
          buttonTitle={isEdit ? "Update Staff" : "Create Staff"}
          loadingButtonTitle={isEdit ? "Updating staff, please wait..." : "Creating staff, please wait..."}
        />
      </div>
    </form>
  );
}