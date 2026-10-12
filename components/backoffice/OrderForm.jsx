// components/backoffice/OrderForm.jsx
// Route: n/a (shared form used by /dashboard/orders/new and /dashboard/orders/update/[id])
"use client";

import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import FormHeader from "@/components/backoffice/FormHeader";
import TextInput from "@/components/FormInputs/TextInput";
import TextareaInput from "@/components/FormInputs/TextAreasInput";
import ToggleInput from "@/components/FormInputs/ToggleInput";
import SubmitButton from "@/components/FormInputs/SubmitButton";
import FormField, { inputClass } from "@/components/backoffice/FormField";
import CustomerPicker from "@/components/backoffice/CustomerPicker";
import LineItemsEditor from "@/components/backoffice/LineItemsEditor";
import { makePostRequest, makePutRequest } from "@/lib/apiRequest";
import { ORDER_TRANSITIONS, PAYMENT_METHODS, prettify } from "@/lib/constants";
import { money } from "@/lib/format";

const card =
  "mx-auto my-3 w-full max-w-5xl rounded-lg border border-gray-200 bg-white p-4 shadow dark:border-gray-700 dark:bg-gray-800 sm:p-6";

export default function OrderForm({ order = null }) {
  const isEdit = Boolean(order);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState(order?.customer ?? null);
  const [items, setItems] = useState([]);

  const {
    register,
    reset,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      customerName: order?.invoice?.customerName ?? order?.customer?.name ?? "",
      customerTin: order?.invoice?.customerTin ?? "",
      phone: order?.phone ?? "",
      address: order?.address ?? "",
      notes: order?.notes ?? "",
      status: order?.status ?? "PENDING",
      refund: false,
      couponCode: "",
      tax: 0,
      discount: 0,
      createInvoice: true,
      dueAt: "",
      payAmount: "",
      payMethod: "CASH",
    },
  });

  const tax = Number(watch("tax")) || 0;
  const discount = Number(watch("discount")) || 0;
  const payAmount = Number(watch("payAmount")) || 0;
  const status = watch("status");
  const createInvoice = watch("createInvoice");

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0),
    [items]
  );
  const estimatedTotal = Math.max(0, subtotal + tax - discount);
  const nextStatuses = isEdit ? ORDER_TRANSITIONS[order.status] ?? [] : [];

  function pickCustomer(c) {
    setCustomer(c);
    if (!c) return;
    setValue("customerName", c.name);
    const saved = c.addresses?.find((a) => a.isDefault) ?? c.addresses?.[0];
    setValue("phone", saved?.phone || c.phone || "");
    if (saved) setValue("address", [saved.address, saved.city].filter(Boolean).join(", "));
  }

  function redirect() {
    router.push("/dashboard/orders");
  }

  async function onSubmit(data) {
    if (isEdit) {
      const payload = { phone: data.phone, address: data.address, notes: data.notes };
      if (data.status !== order.status) {
        payload.status = data.status;
        payload.refund = data.status === "CANCELLED" && data.refund;
      }
      makePutRequest(setLoading, `/api/orders/${order.id}`, payload, "Order", redirect);
      return;
    }

    if (items.length === 0) return toast.error("Add at least one product");
    const lacking = items.find((i) => Number(i.quantity) > i.stock);
    if (lacking) return toast.error(`Only ${lacking.stock} of ${lacking.name} in stock`);
    if (payAmount > estimatedTotal) return toast.error("Payment is more than the order total");

    const payload = {
      customerId: customer?.id ?? null,
      customerName: data.customerName,
      customerTin: data.customerTin,
      phone: data.phone,
      address: data.address,
      notes: data.notes,
      couponCode: data.couponCode,
      tax,
      discount,
      createInvoice: data.createInvoice,
      dueAt: data.dueAt || null,
      items: items.map((i) => ({ productId: i.productId, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice) })),
      initialPayment: payAmount > 0 ? { amount: payAmount, method: data.payMethod } : null,
    };

    const result = await makePostRequest(setLoading, "/api/orders", payload, "Order", null, null);
    if (result?.data?.id) {
      reset();
      router.push(`/dashboard/orders/${result.data.id}`);
    }
  }

  return (
    <div>
      <FormHeader title={isEdit ? `Update Order ${order.orderNumber}` : "New Order"} />

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Customer + delivery */}
        <div className={card}>
          <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">Customer & delivery</h3>
          {!isEdit && (
            <div className="mb-4">
              <CustomerPicker customer={customer} onChange={pickCustomer} />
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
            {!isEdit && (
              <TextInput label="Customer name (printed on invoice)" name="customerName" isRequired={false} register={register} errors={errors} className="w-full" />
            )}
            <TextInput label="Phone" name="phone" register={register} errors={errors} className="w-full" />
            <TextInput label="Delivery address" name="address" register={register} errors={errors} className="w-full" />
            {!isEdit && (
              <TextInput label="Customer TIN" name="customerTin" isRequired={false} register={register} errors={errors} className="w-full" />
            )}
            <TextareaInput label="Notes" name="notes" isRequired={false} register={register} errors={errors} />
          </div>
        </div>

        {/* Items */}
        <div className={card}>
          <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">Items</h3>
          {isEdit ? (
            <>
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                  <tbody>
                    {order.items.map((i) => (
                      <tr key={i.id} className="border-b last:border-0 dark:border-gray-700">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{i.product?.name ?? "Deleted product"}</td>
                        <td className="px-4 py-3">
                          {i.quantity} x {money(i.unitPrice)}
                        </td>
                        <td className="px-4 py-3 text-right">{money(i.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Items are locked because stock was already deducted. To change them, cancel this order and create a new one.
              </p>
            </>
          ) : (
            <LineItemsEditor items={items} onChange={setItems} checkStock />
          )}
        </div>

        {/* Pricing, invoice & payment (new) / status (edit) */}
        <div className={card}>
          {isEdit ? (
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
              <FormField label="Order status">
                <select {...register("status")} className={inputClass}>
                  <option value={order.status}>{prettify(order.status)} (current)</option>
                  {nextStatuses.map((s) => (
                    <option key={s} value={s}>{prettify(s)}</option>
                  ))}
                </select>
              </FormField>
              {status === "CANCELLED" && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                  Cancelling puts the stock back, voids the invoice and releases the coupon.
                  <label className="mt-2 flex items-center gap-2 font-medium">
                    <input type="checkbox" {...register("refund")} /> Mark existing payments as refunded
                  </label>
                </div>
              )}
            </div>
          ) : (
            <>
              <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">Pricing, invoice & payment</h3>
              <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
                <TextInput label="Coupon code" name="couponCode" isRequired={false} register={register} errors={errors} className="w-full" />
                <TextInput label="Tax (UGX)" name="tax" type="number" isRequired={false} register={register} errors={errors} className="w-full" />
                <TextInput label="Extra discount (UGX)" name="discount" type="number" isRequired={false} register={register} errors={errors} className="w-full" />
                <ToggleInput label="Create invoice" name="createInvoice" trueTitle="Yes, issue invoice" falseTitle="No invoice" register={register} />
                {createInvoice && (
                  <TextInput label="Invoice due date" name="dueAt" type="date" isRequired={false} register={register} errors={errors} className="w-full" />
                )}
                <TextInput label="Amount paid now (UGX)" name="payAmount" type="number" isRequired={false} register={register} errors={errors} className="w-full" />
                <FormField label="Payment method">
                  <select {...register("payMethod")} className={inputClass}>
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>{prettify(m)}</option>
                    ))}
                  </select>
                </FormField>
              </div>

              <div className="mt-6 ml-auto max-w-xs space-y-1 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>{money(subtotal)}</span></div>
                <div className="flex justify-between"><span>Tax</span><span>{money(tax)}</span></div>
                <div className="flex justify-between"><span>Discount</span><span>- {money(discount)}</span></div>
                <div className="flex justify-between border-t pt-2 text-base font-bold text-gray-900 dark:text-white">
                  <span>Estimated total</span><span>{money(estimatedTotal)}</span>
                </div>
                {payAmount > 0 && (
                  <div className="flex justify-between text-gray-500"><span>Balance after payment</span><span>{money(Math.max(0, estimatedTotal - payAmount))}</span></div>
                )}
                <p className="pt-1 text-xs text-gray-500">Coupon discounts are applied and shown after saving.</p>
              </div>
            </>
          )}

          <SubmitButton
            isLoading={loading}
            buttonTitle={isEdit ? "Update Order" : "Create Order"}
            loadingButtonTitle={isEdit ? "Updating Order please wait..." : "Creating Order please wait..."}
          />
        </div>
      </form>
    </div>
  );
}
