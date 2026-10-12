// components/backoffice/InvoiceForm.jsx
// Route: n/a (shared form used by /dashboard/invoices/new and /dashboard/invoices/update/[id])
"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import FormHeader from "@/components/backoffice/FormHeader";
import TextInput from "@/components/FormInputs/TextInput";
import TextareaInput from "@/components/FormInputs/TextAreasInput";
import SelectInput from "@/components/FormInputs/SelectInput";
import SubmitButton from "@/components/FormInputs/SubmitButton";
import { makeGetRequest, makePostRequest, makePutRequest } from "@/lib/apiRequest";

const money = (value) => `UGX ${Number(value ?? 0).toLocaleString()}`;
const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : "");
const today = () => new Date().toISOString().slice(0, 10);

const STATUS_OPTIONS = [
  { id: "DRAFT", title: "Draft (save for later)" },
  { id: "ISSUED", title: "Issued" },
  { id: "SENT", title: "Sent to customer" },
];

export default function InvoiceForm({ invoice = null }) {
  const isEdit = Boolean(invoice);
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [loadingData, setLoadingData] = useState(!isEdit);
  const [loading, setLoading] = useState(false);

  const {
    register,
    reset,
    setValue,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      orderId: invoice?.orderId ?? "",
      number: "",
      customerName: invoice?.customerName ?? "",
      customerEmail: invoice?.customerEmail ?? "",
      customerTin: invoice?.customerTin ?? "",
      issuedAt: toDateInput(invoice?.issuedAt) || today(),
      dueAt: toDateInput(invoice?.dueAt),
      status: invoice?.status && STATUS_OPTIONS.some((s) => s.id === invoice.status) ? invoice.status : "ISSUED",
      tax: invoice?.tax ?? 0,
      discount: invoice?.discount ?? 0,
      amountPaid: invoice?.amountPaid ?? 0,
      notes: invoice?.notes ?? "",
    },
  });

  // Create mode: load orders that have no invoice yet
  useEffect(() => {
    if (isEdit) return;
    async function loadOrders() {
      const data = await makeGetRequest("/api/invoices/eligible-orders");
      setOrders(Array.isArray(data) ? data : []);
      setLoadingData(false);
    }
    loadOrders();
  }, [isEdit]);

  const orderId = watch("orderId");
  const selectedOrder = isEdit ? invoice.order : orders.find((o) => o.id === orderId);
  const items = selectedOrder?.items ?? [];

  // Auto-fill the fields when an order is chosen
  useEffect(() => {
    if (isEdit || !selectedOrder) return;
    setValue("customerName", selectedOrder.customer?.name ?? "");
    setValue("customerEmail", selectedOrder.customer?.email ?? "");
    setValue("tax", selectedOrder.tax ?? 0);
    setValue("discount", selectedOrder.discount ?? 0);
    setValue("amountPaid", selectedOrder.paidTotal ?? 0);
  }, [selectedOrder, isEdit, setValue]);

  const subtotal = isEdit ? invoice.subtotal : selectedOrder?.subtotal ?? 0;
  const tax = Number(watch("tax")) || 0;
  const discount = Number(watch("discount")) || 0;
  const amountPaid = Number(watch("amountPaid")) || 0;
  const total = Math.max(0, subtotal + tax - discount);
  const balance = Math.max(0, total - amountPaid);

  function redirect() {
    router.push("/dashboard/invoices");
  }

  function onSubmit(data) {
    if (!isEdit && !data.orderId) return;
    const payload = {
      orderId: data.orderId,
      number: data.number,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerTin: data.customerTin,
      issuedAt: data.issuedAt,
      dueAt: data.dueAt || null,
      status: data.status,
      tax: Number(data.tax) || 0,
      discount: Number(data.discount) || 0,
      amountPaid: Number(data.amountPaid) || 0,
      notes: data.notes,
    };

    if (isEdit) {
      makePutRequest(setLoading, `/api/invoices/${invoice.id}`, payload, "Invoice", redirect);
    } else {
      makePostRequest(setLoading, "/api/invoices", payload, "Invoice", reset, redirect);
    }
  }

  if (loadingData) return <p className="p-6 text-center">Loading form...</p>;

  const orderOptions = orders.map((o) => ({
    id: o.id,
    title: `${o.orderNumber} - ${o.customer?.name ?? o.phone} - ${money(o.total)}`,
  }));

  return (
    <div>
      <FormHeader title={isEdit ? `Update Invoice ${invoice.number}` : "New Invoice"} />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mx-auto my-3 w-full max-w-5xl rounded-lg border border-gray-200 bg-white p-4 shadow dark:border-gray-700 dark:bg-gray-800 sm:p-6 md:p-8"
      >
        {!isEdit && orders.length === 0 && (
          <p className="mb-4 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
            There are no orders waiting for an invoice. Every order already has one.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
          {isEdit ? (
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">Order:</span> {invoice.order?.orderNumber}
            </div>
          ) : (
            <SelectInput
              label="Select Order"
              name="orderId"
              register={register}
              errors={errors}
              className="w-full"
              options={orderOptions}
            />
          )}
          {!isEdit && (
            <TextInput
              label="Invoice No. (leave blank to auto-generate)"
              name="number"
              isRequired={false}
              register={register}
              errors={errors}
              className="w-full"
            />
          )}
          <TextInput label="Customer Name (M/s)" name="customerName" register={register} errors={errors} className="w-full" />
          <TextInput label="Customer Email" name="customerEmail" type="email" isRequired={false} register={register} errors={errors} className="w-full" />
          <TextInput label="Customer Tin No." name="customerTin" isRequired={false} register={register} errors={errors} className="w-full" />
          <SelectInput label="Invoice Status" name="status" register={register} errors={errors} className="w-full" options={STATUS_OPTIONS} />
          <TextInput label="Invoice Date" name="issuedAt" type="date" register={register} errors={errors} className="w-full" />
          <TextInput label="Due Date" name="dueAt" type="date" isRequired={false} register={register} errors={errors} className="w-full" />
          <TextInput label="Tax (UGX)" name="tax" type="number" isRequired={false} register={register} errors={errors} className="w-full" />
          <TextInput label="Discount (UGX)" name="discount" type="number" isRequired={false} register={register} errors={errors} className="w-full" />
          <TextInput label="Amount Paid (UGX)" name="amountPaid" type="number" isRequired={false} register={register} errors={errors} className="w-full" />
        </div>

        {/* Items preview (read-only: they come from the order) */}
        {selectedOrder && (
          <div className="mt-8">
            <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Items (from order)</h3>
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full min-w-[520px] text-left text-sm text-gray-500 dark:text-gray-400">
                <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th className="px-3 py-3">Product</th>
                    <th className="px-3 py-3">Qty</th>
                    <th className="px-3 py-3 text-right">Rate</th>
                    <th className="px-3 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b dark:border-gray-700">
                      <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">{item.product?.name ?? "Deleted product"}</td>
                      <td className="px-3 py-2">{item.quantity}</td>
                      <td className="px-3 py-2 text-right">{money(item.unitPrice)}</td>
                      <td className="px-3 py-2 text-right">{money(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 ml-auto w-full max-w-xs space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <div className="flex justify-between"><span>Subtotal</span><span>{money(subtotal)}</span></div>
              <div className="flex justify-between"><span>Tax</span><span>{money(tax)}</span></div>
              <div className="flex justify-between"><span>Discount</span><span>- {money(discount)}</span></div>
              <div className="flex justify-between border-t pt-2 text-base font-semibold text-gray-900 dark:border-gray-600 dark:text-white">
                <span>Total</span><span>{money(total)}</span>
              </div>
              <div className="flex justify-between"><span>Paid</span><span>{money(amountPaid)}</span></div>
              <div className="flex justify-between font-semibold"><span>Balance</span><span>{money(balance)}</span></div>
            </div>
          </div>
        )}

        <div className="mt-6">
          <TextareaInput label="Notes" name="notes" isRequired={false} register={register} errors={errors} />
        </div>

        <SubmitButton
          isLoading={loading}
          buttonTitle={isEdit ? "Update Invoice" : "Create Invoice"}
          loadingButtonTitle={isEdit ? "Updating Invoice please wait..." : "Creating Invoice please wait..."}
        />
      </form>
    </div>
  );
}