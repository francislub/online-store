// components/backoffice/PaymentForm.jsx
// Route: n/a (shared form used by /dashboard/payments/new and /dashboard/payments/update/[id])
"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import FormHeader from "@/components/backoffice/FormHeader";
import TextInput from "@/components/FormInputs/TextInput";
import TextareaInput from "@/components/FormInputs/TextAreasInput";
import SubmitButton from "@/components/FormInputs/SubmitButton";
import FormField, { inputClass } from "@/components/backoffice/FormField";
import LookupSelect from "@/components/backoffice/LookupSelect";
import CustomerPicker from "@/components/backoffice/CustomerPicker";
import { makeGetRequest, makePostRequest, makePutRequest } from "@/lib/apiRequest";
import { PAYMENT_METHODS, PAYMENT_STATUSES, prettify } from "@/lib/constants";
import { money, toDateInput } from "@/lib/format";

const today = () => new Date().toISOString().slice(0, 10);

// payment: existing payment (edit) | presetOrderId: from /dashboard/payments/new?orderId=...
export default function PaymentForm({ payment = null, presetOrderId = null }) {
  const isEdit = Boolean(payment);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null); // { id, orderNumber, total, paid, balance, customerName }
  const [customer, setCustomer] = useState(payment?.customer ?? null);

  const {
    register,
    reset,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      amount: payment?.amount ?? "",
      method: payment?.method ?? "CASH",
      status: payment?.status ?? "AUTO",
      paidAt: payment ? toDateInput(payment.paidAt) : today(),
      notes: payment?.notes ?? "",
    },
  });

  // When coming from an order page, load that order and pre-fill the balance
  useEffect(() => {
    if (!presetOrderId || isEdit) return;
    (async () => {
      const rows = await makeGetRequest("/api/lookups?type=orders&withBalance=1");
      const found = Array.isArray(rows) ? rows.find((o) => o.id === presetOrderId) : null;
      if (found) selectOrder(found);
      else toast.error("That order has no outstanding balance");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetOrderId]);

  function selectOrder(o) {
    setOrder(o);
    setValue("amount", o.balance);
  }

  function redirect() {
    router.push("/dashboard/payments");
  }

  async function onSubmit(data) {
    const amount = Number(data.amount);
    if (!(amount > 0)) return toast.error("Enter an amount greater than zero");

    if (isEdit) {
      const payload = { amount, method: data.method, status: data.status, paidAt: data.paidAt, notes: data.notes };
      makePutRequest(setLoading, `/api/payments/${payment.id}`, payload, "Payment", redirect);
      return;
    }

    if (!order && !customer) return toast.error("Select an order or a customer");
    if (order && data.status !== "PENDING" && amount > order.balance) {
      return toast.error(`Amount is more than the balance (${money(order.balance)})`);
    }

    const payload = {
      orderId: order?.id ?? null,
      customerId: order?.customerId ?? customer?.id ?? null,
      amount,
      method: data.method,
      status: data.status,
      paidAt: data.paidAt,
      notes: data.notes,
    };
    makePostRequest(setLoading, "/api/payments", payload, "Payment", reset, redirect);
  }

  const statuses = isEdit ? PAYMENT_STATUSES : ["AUTO", "PENDING", "PARTIAL", "PAID"];

  return (
    <div>
      <FormHeader title={isEdit ? `Update Payment ${payment.reference}` : "Record Payment"} />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mx-auto my-3 w-full max-w-4xl rounded-lg border border-gray-200 bg-white p-4 shadow dark:border-gray-700 dark:bg-gray-800 sm:p-6 md:p-8"
      >
        {/* Order / customer */}
        <div className="mb-6">
          <div className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Order</div>
          {isEdit ? (
            <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm dark:bg-gray-700 dark:text-white">
              {payment.order ? `${payment.order.orderNumber} (total ${money(payment.order.total)})` : "No order, account payment"}
              {payment.customer && <span className="text-gray-500"> • {payment.customer.name}</span>}
            </div>
          ) : order ? (
            <div className="flex items-center justify-between rounded-lg border border-lime-200 bg-lime-50 px-4 py-3 text-sm dark:border-lime-900 dark:bg-gray-700">
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">{order.orderNumber} • {order.customerName}</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">
                  Total {money(order.total)} • Paid {money(order.paid)} • <span className="font-semibold">Balance {money(order.balance)}</span>
                </div>
              </div>
              <button type="button" onClick={() => setOrder(null)} className="text-gray-500 hover:text-red-600" aria-label="Clear order">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <LookupSelect
              type="orders"
              params={{ withBalance: "1" }}
              placeholder="Search unpaid orders by number, customer or phone"
              onSelect={selectOrder}
              renderOption={(o) => (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">{o.orderNumber}</div>
                    <div className="text-xs text-gray-500">{o.customerName}</div>
                  </div>
                  <div className="text-right text-xs">
                    <div className="font-semibold">{money(o.balance)} due</div>
                    <div className="text-gray-500">of {money(o.total)}</div>
                  </div>
                </div>
              )}
            />
          )}

          {!isEdit && !order && (
            <div className="mt-3">
              <div className="mb-2 text-xs text-gray-500">No order? Record an account payment for a customer instead:</div>
              <CustomerPicker customer={customer} onChange={setCustomer} />
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
          <div>
            <TextInput label="Amount (UGX)" name="amount" type="number" register={register} errors={errors} className="w-full" />
            {order && !isEdit && (
              <button
                type="button"
                onClick={() => setValue("amount", order.balance)}
                className="mt-1 text-xs font-medium text-lime-700 hover:underline"
              >
                Use full balance ({money(order.balance)})
              </button>
            )}
          </div>
          <FormField label="Method">
            <select {...register("method")} className={inputClass}>
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>{prettify(m)}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Status" hint={!isEdit ? "Auto marks it Paid when it clears the balance, otherwise Partial." : undefined}>
            <select {...register("status")} className={inputClass}>
              {statuses.map((s) => (
                <option key={s} value={s}>{s === "AUTO" ? "Auto (recommended)" : prettify(s)}</option>
              ))}
            </select>
          </FormField>
          <TextInput label="Date paid" name="paidAt" type="date" isRequired={false} register={register} errors={errors} className="w-full" />
          <TextareaInput label="Notes (mobile money ID, bank slip no...)" name="notes" isRequired={false} register={register} errors={errors} />
        </div>

        <SubmitButton
          isLoading={loading}
          buttonTitle={isEdit ? "Update Payment" : "Record Payment"}
          loadingButtonTitle={isEdit ? "Updating Payment please wait..." : "Recording Payment please wait..."}
        />
      </form>
    </div>
  );
}
