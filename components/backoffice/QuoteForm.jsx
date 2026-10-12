// components/backoffice/QuoteForm.jsx
// Route: n/a (shared form used by /dashboard/quotes/new and /dashboard/quotes/update/[id])
"use client";

import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import FormHeader from "@/components/backoffice/FormHeader";
import TextInput from "@/components/FormInputs/TextInput";
import TextareaInput from "@/components/FormInputs/TextAreasInput";
import SubmitButton from "@/components/FormInputs/SubmitButton";
import FormField, { inputClass } from "@/components/backoffice/FormField";
import CustomerPicker from "@/components/backoffice/CustomerPicker";
import LineItemsEditor from "@/components/backoffice/LineItemsEditor";
import { makePostRequest, makePutRequest } from "@/lib/apiRequest";
import { money, toDateInput } from "@/lib/format";
import { prettify } from "@/lib/constants";

const card =
  "mx-auto my-3 w-full max-w-5xl rounded-lg border border-gray-200 bg-white p-4 shadow dark:border-gray-700 dark:bg-gray-800 sm:p-6";

// default validity: 14 days from today
const inTwoWeeks = () => new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);

export default function QuoteForm({ quote = null }) {
  const isEdit = Boolean(quote);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState(quote?.customer ?? null);
  const [items, setItems] = useState(
    (quote?.items ?? []).map((i) => ({
      productId: i.productId,
      name: i.name,
      sku: i.sku,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    }))
  );

  const {
    register,
    reset,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      status: quote?.status ?? "DRAFT",
      validUntil: quote ? toDateInput(quote.validUntil) : inTwoWeeks(),
      tax: quote?.tax ?? 0,
      discount: quote?.discount ?? 0,
      notes: quote?.notes ?? "",
    },
  });

  const tax = Number(watch("tax")) || 0;
  const discount = Number(watch("discount")) || 0;
  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0),
    [items]
  );
  const total = Math.max(0, subtotal + tax - discount);
  const statusOptions = isEdit ? ["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"] : ["DRAFT", "SENT"];

  function redirect() {
    router.push("/dashboard/quotes");
  }

  async function onSubmit(data) {
    if (items.length === 0) return toast.error("Add at least one product");

    const payload = {
      customerId: customer?.id ?? null,
      status: data.status,
      validUntil: data.validUntil || null,
      tax,
      discount,
      notes: data.notes,
      items: items.map((i) => ({ productId: i.productId, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice) })),
    };

    if (isEdit) {
      makePutRequest(setLoading, `/api/quotes/${quote.id}`, payload, "Quote", redirect);
    } else {
      makePostRequest(setLoading, "/api/quotes", payload, "Quote", reset, redirect);
    }
  }

  return (
    <div>
      <FormHeader title={isEdit ? `Update Quote ${quote.number}` : "New Quote"} />

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className={card}>
          <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">Customer & validity</h3>
          <div className="mb-4">
            <CustomerPicker customer={customer} onChange={setCustomer} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
            <FormField label="Status">
              <select {...register("status")} className={inputClass}>
                {statusOptions.map((s) => (
                  <option key={s} value={s}>{prettify(s)}</option>
                ))}
              </select>
            </FormField>
            <TextInput label="Valid until" name="validUntil" type="date" isRequired={false} register={register} errors={errors} className="w-full" />
            <TextareaInput label="Notes (prospect name, terms, delivery...)" name="notes" isRequired={false} register={register} errors={errors} />
          </div>
        </div>

        <div className={card}>
          <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">Items</h3>
          <LineItemsEditor items={items} onChange={setItems} />

          <div className="mt-6 grid gap-4 sm:grid-cols-2 sm:gap-6">
            <TextInput label="Tax (UGX)" name="tax" type="number" isRequired={false} register={register} errors={errors} className="w-full" />
            <TextInput label="Discount (UGX)" name="discount" type="number" isRequired={false} register={register} errors={errors} className="w-full" />
          </div>

          <div className="mt-6 ml-auto max-w-xs space-y-1 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{money(subtotal)}</span></div>
            <div className="flex justify-between"><span>Tax</span><span>{money(tax)}</span></div>
            <div className="flex justify-between"><span>Discount</span><span>- {money(discount)}</span></div>
            <div className="flex justify-between border-t pt-2 text-base font-bold text-gray-900 dark:text-white">
              <span>Total</span><span>{money(total)}</span>
            </div>
          </div>

          <SubmitButton
            isLoading={loading}
            buttonTitle={isEdit ? "Update Quote" : "Create Quote"}
            loadingButtonTitle={isEdit ? "Updating Quote please wait..." : "Creating Quote please wait..."}
          />
        </div>
      </form>
    </div>
  );
}
