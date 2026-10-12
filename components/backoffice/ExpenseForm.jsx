// components/backoffice/ExpenseForm.jsx
// Route: n/a (shared form used by /dashboard/expenses/new and /dashboard/expenses/update/[id])
"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import FormHeader from "@/components/backoffice/FormHeader";
import TextInput from "@/components/FormInputs/TextInput";
import TextareaInput from "@/components/FormInputs/TextAreasInput";
import SelectInput from "@/components/FormInputs/SelectInput";
import SubmitButton from "@/components/FormInputs/SubmitButton";
import { makePostRequest, makePutRequest } from "@/lib/apiRequest";
import { dayKey, todayKey } from "@/lib/dates";

const CATEGORY_OPTIONS = [
  { id: "RENT", title: "Rent" },
  { id: "TRANSPORT", title: "Transport" },
  { id: "SALARIES", title: "Salaries" },
  { id: "UTILITIES", title: "Utilities (power, water, internet)" },
  { id: "REPAIRS", title: "Repairs" },
  { id: "MARKETING", title: "Marketing" },
  { id: "SUPPLIES", title: "Supplies" },
  { id: "OTHER", title: "Other" },
];

export default function ExpenseForm({ expense = null }) {
  const isEdit = Boolean(expense);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: expense?.title ?? "",
      category: expense?.category ?? "OTHER",
      amount: expense?.amount ?? "",
      spentAt: expense?.spentAt ? dayKey(expense.spentAt) : todayKey(),
      description: expense?.description ?? "",
    },
  });

  function redirect() {
    router.push("/dashboard/expenses");
  }

  function onSubmit(data) {
    const payload = {
      title: data.title,
      category: data.category,
      amount: Number(data.amount),
      spentAt: data.spentAt,
      description: data.description,
    };

    if (isEdit) {
      makePutRequest(setLoading, `/api/expenses/${expense.id}`, payload, "Expense", redirect);
    } else {
      makePostRequest(setLoading, "/api/expenses", payload, "Expense", reset, redirect);
    }
  }

  return (
    <div>
      <FormHeader title={isEdit ? `Update Expense: ${expense.title}` : "New Expense"} />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mx-auto my-3 w-full max-w-4xl rounded-lg border border-gray-200 bg-white p-4 shadow dark:border-gray-700 dark:bg-gray-800 sm:p-6 md:p-8"
      >
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
          <TextInput label="Expense Title" name="title" register={register} errors={errors} className="w-full" />
          <SelectInput
            label="Category"
            name="category"
            register={register}
            errors={errors}
            className="w-full"
            options={CATEGORY_OPTIONS}
          />
          <TextInput label="Amount (UGX)" name="amount" type="number" register={register} errors={errors} className="w-full" />
          <TextInput label="Date Spent" name="spentAt" type="date" register={register} errors={errors} className="w-full" />
        </div>

        <div className="mt-6">
          <TextareaInput label="Description" name="description" isRequired={false} register={register} errors={errors} />
        </div>

        <SubmitButton
          isLoading={loading}
          buttonTitle={isEdit ? "Update Expense" : "Save Expense"}
          loadingButtonTitle={isEdit ? "Updating Expense please wait..." : "Saving Expense please wait..."}
        />
      </form>
    </div>
  );
}