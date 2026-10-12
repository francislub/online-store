// components/backoffice/ReturnForm.jsx
// Route: n/a (shared form used by /dashboard/returns/new and /dashboard/returns/update/[id])
"use client";

import React, { useEffect, useMemo, useState } from "react";
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
import { makeGetRequest, makePostRequest, makePutRequest } from "@/lib/apiRequest";
import { RETURN_REASONS } from "@/lib/constants";
import { fmtDate, money } from "@/lib/format";

const card =
  "mx-auto my-3 w-full max-w-5xl rounded-lg border border-gray-200 bg-white p-4 shadow dark:border-gray-700 dark:bg-gray-800 sm:p-6";

// presetOrderId: from /dashboard/returns/new?orderId=...   |   ret: existing return (edit)
export default function ReturnForm({ ret = null, presetOrderId = null }) {
  const isEdit = Boolean(ret);
  const itemsLocked = isEdit && ret.status !== "REQUESTED"; // items can only change before approval
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(ret?.order ?? null);
  const [lines, setLines] = useState([]); // returnable lines with the quantity chosen
  const [refundTouched, setRefundTouched] = useState(isEdit);

  const {
    register,
    reset,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      reason: ret?.reason ?? "",
      notes: ret?.notes ?? "",
      refundAmount: ret?.refundAmount ?? 0,
    },
  });

  async function loadLines(orderId) {
    const query = new URLSearchParams({ type: "return-items", orderId });
    if (isEdit) query.set("excludeReturnId", ret.id);
    const data = await makeGetRequest(`/api/lookups?${query.toString()}`);
    if (!data) return;
    const chosen = new Map((ret?.items ?? []).map((i) => [i.productId, i.quantity]));
    setLines(data.lines.map((l) => ({ ...l, quantity: chosen.get(l.productId) ?? 0 })));
  }

  useEffect(() => {
    if (isEdit) loadLines(ret.orderId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!presetOrderId || isEdit) return;
    (async () => {
      const rows = await makeGetRequest("/api/lookups?type=returnable-orders");
      const found = Array.isArray(rows) ? rows.find((o) => o.id === presetOrderId) : null;
      if (found) selectOrder(found);
      else toast.error("That order can't have returns (it must be shipped or completed)");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetOrderId]);

  function selectOrder(o) {
    setOrder(o);
    setRefundTouched(false);
    loadLines(o.id);
  }

  function clearOrder() {
    setOrder(null);
    setLines([]);
  }

  const itemsTotal = useMemo(
    () => lines.reduce((sum, l) => sum + Math.round(l.netUnit * (Number(l.quantity) || 0)), 0),
    [lines]
  );
  const refundAmount = Number(watch("refundAmount")) || 0;

  // keep the refund in step with the selected items until the user types their own figure
  useEffect(() => {
    if (!refundTouched && !itemsLocked) setValue("refundAmount", itemsTotal);
  }, [itemsTotal, refundTouched, itemsLocked, setValue]);

  function setQty(productId, value) {
    setLines((prev) =>
      prev.map((l) => (l.productId === productId ? { ...l, quantity: Math.max(0, Math.min(l.available, Number(value) || 0)) } : l))
    );
  }

  function redirect() {
    router.push("/dashboard/returns");
  }

  async function onSubmit(data) {
    const picked = lines.filter((l) => Number(l.quantity) > 0).map((l) => ({ productId: l.productId, quantity: Number(l.quantity) }));
    if (!itemsLocked && picked.length === 0) return toast.error("Choose at least one item to return");
    if (refundAmount > itemsTotal && !itemsLocked) return toast.error(`Refund can't be more than ${money(itemsTotal)}`);

    const payload = { reason: data.reason, notes: data.notes, refundAmount };

    if (isEdit) {
      if (!itemsLocked) payload.items = picked;
      makePutRequest(setLoading, `/api/returns/${ret.id}`, payload, "Return", redirect);
      return;
    }

    if (!order) return toast.error("Select the order first");
    const result = await makePostRequest(setLoading, "/api/returns", { ...payload, orderId: order.id, items: picked }, "Return", null, null);
    if (result?.data?.id) {
      reset();
      router.push(`/dashboard/returns/${result.data.id}`);
    }
  }

  return (
    <div>
      <FormHeader title={isEdit ? `Update Return ${ret.reference}` : "New Return"} />

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Order */}
        <div className={card}>
          <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">Order</h3>
          {order ? (
            <div className="flex items-center justify-between rounded-lg border border-lime-200 bg-lime-50 px-4 py-3 text-sm dark:border-lime-900 dark:bg-gray-700">
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {order.orderNumber} • {order.customerName ?? order.customer?.name ?? order.invoice?.customerName ?? "Walk-in"}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-300">
                  Total {money(order.total)}
                  {order.createdAt && ` • ${fmtDate(order.createdAt)}`}
                </div>
              </div>
              {!isEdit && (
                <button type="button" onClick={clearOrder} className="text-gray-500 hover:text-red-600" aria-label="Clear order">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : (
            <LookupSelect
              type="returnable-orders"
              placeholder="Search shipped or completed orders by number, customer or phone"
              onSelect={selectOrder}
              renderOption={(o) => (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">{o.orderNumber}</div>
                    <div className="text-xs text-gray-500">{o.customerName}</div>
                  </div>
                  <div className="text-right text-xs">
                    <div className="font-semibold">{money(o.total)}</div>
                    <div className="text-gray-500">{fmtDate(o.createdAt)}</div>
                  </div>
                </div>
              )}
            />
          )}
        </div>

        {/* Items */}
        <div className={card}>
          <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">Items being returned</h3>
          {lines.length === 0 ? (
            <p className="text-sm text-gray-500">{order ? "Loading items..." : "Select an order to see what can be returned"}</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Sold</th>
                    <th className="px-4 py-3">Already returned</th>
                    <th className="w-28 px-4 py-3">Return qty</th>
                    <th className="px-4 py-3 text-right">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l) => (
                    <tr key={l.productId} className="border-t bg-white dark:border-gray-700 dark:bg-gray-800">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-white">{l.name}</div>
                        <div className="text-xs">{l.sku} • {money(l.unitPrice)} each</div>
                      </td>
                      <td className="px-4 py-3">{l.sold}</td>
                      <td className="px-4 py-3">{l.returned}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min={0}
                          max={l.available}
                          value={l.quantity}
                          disabled={itemsLocked || l.available === 0}
                          onChange={(e) => setQty(l.productId, e.target.value)}
                          className={inputClass}
                        />
                        <div className="mt-1 text-xs">max {l.available}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                        {money(Math.round(l.netUnit * (Number(l.quantity) || 0)))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {itemsLocked && <p className="mt-2 text-xs text-gray-500">Items are locked once a return is approved.</p>}
          <p className="mt-2 text-xs text-gray-500">Values include any order-level discount, so the customer is refunded what they actually paid per item.</p>
        </div>

        {/* Details */}
        <div className={card}>
          <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">Details</h3>
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
            <FormField label="Common reasons">
              <select defaultValue="" onChange={(e) => e.target.value && setValue("reason", e.target.value)} className={inputClass}>
                <option value="">Pick a reason (optional)</option>
                {RETURN_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </FormField>
            <TextInput label="Reason" name="reason" register={register} errors={errors} className="w-full" />
            <div>
              <FormField label="Refund amount (UGX)">
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  {...register("refundAmount", { onChange: () => setRefundTouched(true) })}
                />
              </FormField>
              <p className="mt-1 text-xs text-gray-500">Items total {money(itemsTotal)}. Lower it to deduct restocking or damage fees.</p>
            </div>
            <TextareaInput label="Notes" name="notes" isRequired={false} register={register} errors={errors} />
          </div>

          <SubmitButton
            isLoading={loading}
            buttonTitle={isEdit ? "Update Return" : "Create Return"}
            loadingButtonTitle={isEdit ? "Updating Return please wait..." : "Creating Return please wait..."}
          />
        </div>
      </form>
    </div>
  );
}
