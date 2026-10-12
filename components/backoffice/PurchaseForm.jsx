// components/backoffice/PurchaseForm.jsx
// Route: n/a (shared form used by /dashboard/purchases/new and /dashboard/purchases/update/[id])
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import FormHeader from "@/components/backoffice/FormHeader";
import TextInput from "@/components/FormInputs/TextInput";
import TextareaInput from "@/components/FormInputs/TextAreasInput";
import SelectInput from "@/components/FormInputs/SelectInput";
import SubmitButton from "@/components/FormInputs/SubmitButton";
import { makeGetRequest, makePostRequest, makePutRequest } from "@/lib/apiRequest";

const money = (value) => `UGX ${Number(value ?? 0).toLocaleString()}`;
const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));

const STATUS_OPTIONS = [
  { id: "DRAFT", title: "Draft (save for later)" },
  { id: "ORDERED", title: "Ordered (sent to supplier)" },
  { id: "RECEIVED", title: "Received (add stock now)" },
];

const emptyLine = () => ({ key: crypto.randomUUID(), productId: "", quantity: 1, unitCost: 0 });

export default function PurchaseForm({ purchase = null }) {
  const isEdit = Boolean(purchase);
  const router = useRouter();

  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);

  const [lines, setLines] = useState(
    purchase?.items?.length
      ? purchase.items.map((i) => ({
          key: i.id,
          productId: i.productId,
          quantity: i.quantity,
          unitCost: i.unitCost,
        }))
      : [emptyLine()]
  );

  const {
    register,
    reset,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      supplierId: purchase?.supplierId ?? "",
      purchasedAt: toDateInput(purchase?.purchasedAt),
      status: purchase?.status ?? "DRAFT",
      tax: purchase?.tax ?? 0,
      notes: purchase?.notes ?? "",
    },
  });

  useEffect(() => {
    async function loadData() {
      const [s, p] = await Promise.all([makeGetRequest("/api/suppliers"), makeGetRequest("/api/products")]);
      setSuppliers(Array.isArray(s) ? s.filter((x) => x.isActive || x.id === purchase?.supplierId) : []);
      setProducts(Array.isArray(p) ? p : []);
      setLoadingData(false);
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tax = Number(watch("tax")) || 0;
  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + (Number(l.quantity) || 0) * (Number(l.unitCost) || 0), 0),
    [lines]
  );
  const total = subtotal + tax;

  function updateLine(key, patch) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function selectProduct(key, productId) {
    const product = products.find((p) => p.id === productId);
    updateLine(key, { productId, unitCost: product?.costPrice ?? 0 });
  }

  function addLine() {
    setLines((prev) => [...prev, emptyLine()]);
  }

  function removeLine(key) {
    setLines((prev) => (prev.length === 1 ? prev : prev.filter((l) => l.key !== key)));
  }

  function redirect() {
    router.push("/dashboard/purchases");
  }

  function handleReset() {
    reset();
    setLines([emptyLine()]);
  }

  async function onSubmit(data) {
    const filled = lines.filter((l) => l.productId);
    if (filled.length === 0) {
      toast.error("Add at least one product");
      return;
    }
    const ids = filled.map((l) => l.productId);
    if (new Set(ids).size !== ids.length) {
      toast.error("A product appears twice. Combine it into one line");
      return;
    }

    const payload = {
      supplierId: data.supplierId,
      purchasedAt: data.purchasedAt,
      status: data.status,
      tax: Number(data.tax) || 0,
      notes: data.notes,
      items: filled.map((l) => ({
        productId: l.productId,
        quantity: Number(l.quantity),
        unitCost: Number(l.unitCost),
      })),
    };

    if (isEdit) {
      makePutRequest(setLoading, `/api/purchases/${purchase.id}`, payload, "Purchase", redirect);
    } else {
      makePostRequest(setLoading, "/api/purchases", payload, "Purchase", handleReset, redirect);
    }
  }

  if (loadingData) return <p className="p-6 text-center">Loading form...</p>;

  const supplierOptions = suppliers.map((s) => ({ id: s.id, title: s.name }));
  const inputClass =
    "block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-lime-500 focus:ring-lime-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400";

  return (
    <div>
      <FormHeader title={isEdit ? `Update Purchase ${purchase.reference}` : "New Purchase"} />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mx-auto my-3 w-full max-w-5xl rounded-lg border border-gray-200 bg-white p-4 shadow dark:border-gray-700 dark:bg-gray-800 sm:p-6 md:p-8"
      >
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
          <SelectInput
            label="Select Supplier"
            name="supplierId"
            register={register}
            errors={errors}
            className="w-full"
            options={supplierOptions}
          />
          <TextInput label="Purchase Date" name="purchasedAt" type="date" register={register} errors={errors} className="w-full" />
          <SelectInput
            label="Purchase Status"
            name="status"
            register={register}
            errors={errors}
            className="w-full"
            options={STATUS_OPTIONS}
          />
          <TextInput
            label="Tax (UGX)"
            name="tax"
            type="number"
            isRequired={false}
            register={register}
            errors={errors}
            className="w-full"
          />
        </div>

        {/* Line items */}
        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Items</h3>
            <button
              type="button"
              onClick={addLine}
              className="inline-flex items-center gap-2 rounded-lg border border-lime-600 px-3 py-2 text-sm font-medium text-lime-700 hover:bg-lime-50 dark:border-lime-500 dark:text-lime-400 dark:hover:bg-lime-500/10"
            >
              <Plus className="h-4 w-4" /> Add Item
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full min-w-[640px] text-left text-sm text-gray-500 dark:text-gray-400">
              <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th className="px-3 py-3">Product</th>
                  <th className="w-24 px-3 py-3">Qty</th>
                  <th className="w-40 px-3 py-3">Unit Cost</th>
                  <th className="w-40 px-3 py-3 text-right">Line Total</th>
                  <th className="w-12 px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => (
                  <tr key={line.key} className="border-b dark:border-gray-700">
                    <td className="px-3 py-2">
                      <select
                        value={line.productId}
                        onChange={(e) => selectProduct(line.key, e.target.value)}
                        className={inputClass}
                      >
                        <option value="">Select product</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku}) - stock {p.stock}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="1"
                        value={line.quantity}
                        onChange={(e) => updateLine(line.key, { quantity: e.target.value })}
                        className={inputClass}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        value={line.unitCost}
                        onChange={(e) => updateLine(line.key, { unitCost: e.target.value })}
                        className={inputClass}
                      />
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-gray-900 dark:text-white">
                      {money((Number(line.quantity) || 0) * (Number(line.unitCost) || 0))}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => removeLine(line.key)}
                        disabled={lines.length === 1}
                        className="text-red-600 hover:text-red-700 disabled:opacity-30"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-4 ml-auto w-full max-w-xs space-y-1 text-sm text-gray-700 dark:text-gray-300">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{money(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span>{money(tax)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-base font-semibold text-gray-900 dark:border-gray-600 dark:text-white">
              <span>Total</span>
              <span>{money(total)}</span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <TextareaInput label="Notes" name="notes" isRequired={false} register={register} errors={errors} />
        </div>

        <SubmitButton
          isLoading={loading}
          buttonTitle={isEdit ? "Update Purchase" : "Create Purchase"}
          loadingButtonTitle={isEdit ? "Updating Purchase please wait..." : "Creating Purchase please wait..."}
        />
      </form>
    </div>
  );
}