// File: src/components/backoffice/InvoiceForm.jsx
// Route: n/a (shared form used by /dashboard/invoices/new and /dashboard/invoices/update/[id])
"use client";

import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Package, PenLine, Plus, Search, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import FormHeader from "@/components/backoffice/FormHeader";
import SubmitButton from "@/components/FormInputs/SubmitButton";
import { makeGetRequest, makePostRequest, makePutRequest } from "@/lib/apiRequest";
import { calcTotals, lineTotal, money, toDateInput, todayInput } from "@/lib/invoiceFormat";

const STATUS_OPTIONS = [
  { id: "DRAFT", title: "Draft (save for later)" },
  { id: "ISSUED", title: "Issued" },
  { id: "SENT", title: "Sent to customer" },
];

const inputCls =
  "block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-lime-600 focus:ring-lime-600 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400";
const labelCls = "mb-1.5 block text-sm font-medium text-gray-900 dark:text-white";
const cardCls =
  "rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-5";

let keyCounter = 0;
const nextKey = () => `item-${Date.now()}-${keyCounter++}`;

const blankItem = () => ({
  key: nextKey(),
  productId: null,
  description: "",
  details: "",
  quantity: 1,
  unitPrice: 0,
});

const fromSaved = (item) => ({
  key: item.id ?? nextKey(),
  productId: item.productId ?? null,
  description: item.description ?? "",
  details: item.details ?? "",
  quantity: item.quantity ?? 1,
  unitPrice: item.unitPrice ?? 0,
});

const fromOrderItem = (item) => ({
  key: nextKey(),
  productId: item.productId ?? null,
  description: item.product?.name ?? "Item",
  details:
    [item.product?.brand, item.product?.model, item.product?.sku && `SKU: ${item.product.sku}`]
      .filter(Boolean)
      .join(" • ") || "",
  quantity: item.quantity ?? 1,
  unitPrice: item.unitPrice ?? 0,
});

function Field({ label, children, hint }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
    </div>
  );
}

// ───────────── Product picker (search the products module) ─────────────
function ProductPicker({ onPick }) {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(async () => {
      setSearching(true);
      const data = await makeGetRequest(`/api/invoices/products?search=${encodeURIComponent(term)}`);
      setResults(Array.isArray(data) ? data : []);
      setSearching(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [term, open]);

  useEffect(() => {
    function onDown(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={term}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setTerm(e.target.value);
            setOpen(true);
          }}
          placeholder="Search products by name, SKU, brand or barcode..."
          className={`${inputCls} pl-9`}
        />
      </div>

      {open && (
        <div className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-600 dark:bg-gray-800">
          {searching ? (
            <p className="p-3 text-sm text-gray-500">Searching...</p>
          ) : results.length === 0 ? (
            <p className="p-3 text-sm text-gray-500">No products found. Use &quot;Custom item&quot; instead.</p>
          ) : (
            results.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onPick(p);
                  setOpen(false);
                  setTerm("");
                }}
                className="flex w-full items-center justify-between gap-3 border-b border-gray-100 px-3 py-2.5 text-left last:border-b-0 hover:bg-lime-50 dark:border-gray-700 dark:hover:bg-gray-700"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-gray-900 dark:text-white">{p.name}</span>
                  <span className="block truncate text-xs text-gray-500">
                    {[p.brand, p.model, p.sku].filter(Boolean).join(" • ")}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                    {money(p.salePrice ?? p.price)}
                  </span>
                  <span className={`block text-xs ${p.stock > 0 ? "text-gray-500" : "text-red-600"}`}>
                    {p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function InvoiceForm({ invoice = null }) {
  const isEdit = Boolean(invoice);
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [orderId, setOrderId] = useState(invoice?.orderId ?? "");
  const [items, setItems] = useState(() =>
    invoice?.items?.length ? invoice.items.map(fromSaved) : []
  );
  const [loading, setLoading] = useState(false);

  const { register, reset, setValue, handleSubmit, watch } = useForm({
    defaultValues: {
      number: "",
      customerName: invoice?.customerName ?? "",
      customerEmail: invoice?.customerEmail ?? "",
      customerPhone: invoice?.customerPhone ?? "",
      customerAddress: invoice?.customerAddress ?? "",
      customerTin: invoice?.customerTin ?? "",
      issuedAt: toDateInput(invoice?.issuedAt) || todayInput(),
      dueAt: toDateInput(invoice?.dueAt),
      status:
        invoice?.status && STATUS_OPTIONS.some((s) => s.id === invoice.status) ? invoice.status : "ISSUED",
      tax: invoice?.tax ?? 0,
      discount: invoice?.discount ?? 0,
      amountPaid: invoice?.amountPaid ?? 0,
      notes: invoice?.notes ?? "",
    },
  });

  // Create mode only: orders that can still be invoiced (optional shortcut)
  useEffect(() => {
    if (isEdit) return;
    (async () => {
      const data = await makeGetRequest("/api/invoices/eligible-orders");
      setOrders(Array.isArray(data) ? data : []);
    })();
  }, [isEdit]);

  const totals = calcTotals({
    items,
    tax: watch("tax"),
    discount: watch("discount"),
    amountPaid: watch("amountPaid"),
  });

  // ───── item helpers ─────
  function addCatalogProduct(product) {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) => (i.key === existing.key ? { ...i, quantity: Number(i.quantity) + 1 } : i));
      }
      return [
        ...prev,
        {
          key: nextKey(),
          productId: product.id,
          description: product.name,
          details: [product.brand, product.model, product.sku && `SKU: ${product.sku}`]
            .filter(Boolean)
            .join(" • "),
          quantity: 1,
          unitPrice: product.salePrice ?? product.price ?? 0,
        },
      ];
    });
  }

  const addCustomItem = () => setItems((prev) => [...prev, blankItem()]);
  const updateItem = (key, patch) => setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  const removeItem = (key) => setItems((prev) => prev.filter((i) => i.key !== key));

  // ───── optional order ─────
  function handleOrderChange(e) {
    const id = e.target.value;
    if (id && items.length > 0 && !window.confirm("Replace the items below with the items from this order?")) return;
    setOrderId(id);
    if (!id) return;
    const order = orders.find((o) => o.id === id);
    if (!order) return;
    setItems((order.items ?? []).map(fromOrderItem));
    setValue("customerName", order.customer?.name ?? "");
    setValue("customerEmail", order.customer?.email ?? "");
    setValue("customerPhone", order.phone ?? "");
    setValue("customerAddress", order.address ?? "");
    setValue("tax", order.tax ?? 0);
    setValue("discount", order.discount ?? 0);
    setValue("amountPaid", order.paidTotal ?? 0);
  }

  function redirect() {
    router.push("/dashboard/invoices");
  }

  function onSubmit(data) {
    if (items.length === 0) {
      toast.error("Add at least one product or custom item");
      return;
    }
    const bad = items.findIndex((i) => !String(i.description).trim() || Number(i.quantity) <= 0);
    if (bad !== -1) {
      toast.error(`Item ${bad + 1} needs a description and a quantity of at least 1`);
      return;
    }

    const payload = {
      orderId: orderId || null,
      number: data.number,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      customerAddress: data.customerAddress,
      customerTin: data.customerTin,
      issuedAt: data.issuedAt,
      dueAt: data.dueAt || null,
      status: data.status,
      tax: Number(data.tax) || 0,
      discount: Number(data.discount) || 0,
      amountPaid: Number(data.amountPaid) || 0,
      notes: data.notes,
      items: items.map((i) => ({
        productId: i.productId,
        description: i.description,
        details: i.details,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice) || 0,
      })),
    };

    if (isEdit) {
      makePutRequest(setLoading, `/api/invoices/${invoice.id}`, payload, "Invoice", redirect);
    } else {
      makePostRequest(setLoading, "/api/invoices", payload, "Invoice", reset, redirect);
    }
  }

  return (
    <div>
      <FormHeader title={isEdit ? `Update Invoice ${invoice.number}` : "New Invoice"} />

      <form onSubmit={handleSubmit(onSubmit)} className="mx-auto my-3 grid w-full max-w-6xl gap-5 lg:grid-cols-3">
        {/* ───────────── LEFT: customer + items ───────────── */}
        <div className="space-y-5 lg:col-span-2">
          {/* Order (optional) */}
          <section className={cardCls}>
            <h3 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">Order (optional)</h3>
            {isEdit ? (
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {invoice.order?.orderNumber ? (
                  <>
                    Linked to order <span className="font-semibold">{invoice.order.orderNumber}</span>
                  </>
                ) : (
                  "This is a direct invoice (no order attached)."
                )}
              </p>
            ) : (
              <Field
                label="Load from an existing order"
                hint="Not required. Leave it empty to build the invoice from your products or custom items below."
              >
                <select value={orderId} onChange={handleOrderChange} className={inputCls}>
                  <option value="">No order: direct / walk-in invoice</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.orderNumber} - {o.customer?.name ?? o.phone} - {money(o.total)}
                    </option>
                  ))}
                </select>
              </Field>
            )}
          </section>

          {/* Customer */}
          <section className={cardCls}>
            <h3 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">Customer</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Customer name (M/s)">
                <input {...register("customerName")} placeholder="Walk-in customer" className={inputCls} />
              </Field>
              <Field label="Phone">
                <input {...register("customerPhone")} placeholder="07xx xxx xxx" className={inputCls} />
              </Field>
              <Field label="Email">
                <input type="email" {...register("customerEmail")} className={inputCls} />
              </Field>
              <Field label="TIN No.">
                <input {...register("customerTin")} className={inputCls} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Address">
                  <input {...register("customerAddress")} className={inputCls} />
                </Field>
              </div>
            </div>
          </section>

          {/* Items */}
          <section className={cardCls}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Items <span className="text-sm font-normal text-gray-500">({items.length})</span>
              </h3>
              <button
                type="button"
                onClick={addCustomItem}
                className="inline-flex items-center gap-1.5 rounded-lg border border-lime-600 px-3 py-1.5 text-sm font-medium text-lime-700 hover:bg-lime-50 dark:text-lime-400 dark:hover:bg-lime-500/10"
              >
                <Plus className="h-4 w-4" /> Custom item
              </button>
            </div>

            <ProductPicker onPick={addCatalogProduct} />
            <p className="mt-1.5 text-xs text-gray-500">
              Pick products from your catalog, or use <b>Custom item</b> for anything that is not in the
              products module (repairs, services, outside parts...).
            </p>

            {items.length === 0 ? (
              <div className="mt-4 rounded-lg border-2 border-dashed border-gray-200 p-8 text-center text-sm text-gray-500 dark:border-gray-700">
                No items yet. Search a product above or add a custom item.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <div className="hidden grid-cols-12 gap-2 px-1 text-xs font-semibold uppercase text-gray-500 md:grid">
                  <span className="col-span-5">Item</span>
                  <span className="col-span-2">Qty</span>
                  <span className="col-span-2">Rate (UGX)</span>
                  <span className="col-span-2 text-right">Amount</span>
                  <span className="col-span-1" />
                </div>

                {items.map((item, index) => {
                  const catalog = Boolean(item.productId);
                  return (
                    <div
                      key={item.key}
                      className="grid grid-cols-12 items-start gap-2 rounded-lg border border-gray-200 bg-gray-50/60 p-3 dark:border-gray-700 dark:bg-gray-900/30"
                    >
                      <div className="col-span-12 space-y-1.5 md:col-span-5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                              catalog
                                ? "bg-lime-100 text-lime-800 dark:bg-lime-500/20 dark:text-lime-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300"
                            }`}
                          >
                            {catalog ? <Package className="h-3 w-3" /> : <PenLine className="h-3 w-3" />}
                            {catalog ? "Catalog" : "Custom"}
                          </span>
                          <span className="text-xs text-gray-400">#{index + 1}</span>
                        </div>
                        <input
                          value={item.description}
                          onChange={(e) => updateItem(item.key, { description: e.target.value })}
                          placeholder="Product / service description"
                          className={inputCls}
                        />
                        <input
                          value={item.details}
                          onChange={(e) => updateItem(item.key, { details: e.target.value })}
                          placeholder="Details (serial no., specs, warranty...) optional"
                          className={`${inputCls} !py-1.5 text-xs`}
                        />
                      </div>

                      <div className="col-span-4 md:col-span-2 md:pt-7">
                        <label className="mb-1 block text-xs text-gray-500 md:hidden">Qty</label>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => updateItem(item.key, { quantity: e.target.value })}
                          className={inputCls}
                        />
                      </div>
                      <div className="col-span-8 md:col-span-2 md:pt-7">
                        <label className="mb-1 block text-xs text-gray-500 md:hidden">Rate (UGX)</label>
                        <input
                          type="number"
                          min={0}
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item.key, { unitPrice: e.target.value })}
                          className={inputCls}
                        />
                      </div>
                      <div className="col-span-10 flex items-center justify-between md:col-span-2 md:justify-end md:pt-7">
                        <span className="text-xs text-gray-500 md:hidden">Amount</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {money(lineTotal(item.quantity, item.unitPrice))}
                        </span>
                      </div>
                      <div className="col-span-2 flex justify-end md:col-span-1 md:pt-7">
                        <button
                          type="button"
                          onClick={() => removeItem(item.key)}
                          aria-label="Remove item"
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Notes */}
          <section className={cardCls}>
            <Field label="Notes (printed on the invoice)">
              <textarea
                rows={3}
                {...register("notes")}
                placeholder="Payment terms, bank / mobile money details, warranty remarks..."
                className={inputCls}
              />
            </Field>
          </section>
        </div>

        {/* ───────────── RIGHT: settings + totals ───────────── */}
        <aside className="space-y-5 lg:sticky lg:top-4 lg:self-start">
          <section className={cardCls}>
            <h3 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">Invoice details</h3>
            <div className="space-y-4">
              {!isEdit && (
                <Field label="Invoice No." hint="Leave blank to auto-generate.">
                  <input {...register("number")} placeholder="INV-2026-0001" className={inputCls} />
                </Field>
              )}
              <Field label="Status">
                <select {...register("status")} className={inputCls}>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Invoice date">
                  <input type="date" {...register("issuedAt")} className={inputCls} />
                </Field>
                <Field label="Due date">
                  <input type="date" {...register("dueAt")} className={inputCls} />
                </Field>
              </div>
            </div>
          </section>

          <section className={cardCls}>
            <h3 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">Totals</h3>
            <div className="mb-4 grid grid-cols-3 gap-2">
              <Field label="Tax">
                <input type="number" min={0} {...register("tax")} className={inputCls} />
              </Field>
              <Field label="Discount">
                <input type="number" min={0} {...register("discount")} className={inputCls} />
              </Field>
              <Field label="Paid">
                <input type="number" min={0} {...register("amountPaid")} className={inputCls} />
              </Field>
            </div>

            <dl className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd>{money(totals.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Tax</dt>
                <dd>{money(totals.tax)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Discount</dt>
                <dd>- {money(totals.discount)}</dd>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-semibold text-gray-900 dark:border-gray-600 dark:text-white">
                <dt>Total</dt>
                <dd>{money(totals.total)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Paid</dt>
                <dd>{money(totals.amountPaid)}</dd>
              </div>
              <div
                className={`flex justify-between rounded-lg px-3 py-2 font-semibold ${
                  totals.balance > 0
                    ? "bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300"
                    : "bg-lime-50 text-lime-800 dark:bg-lime-500/10 dark:text-lime-300"
                }`}
              >
                <dt>Balance due</dt>
                <dd>{money(totals.balance)}</dd>
              </div>
            </dl>

            <div className="mt-5">
              <SubmitButton
                isLoading={loading}
                buttonTitle={isEdit ? "Update Invoice" : "Create Invoice"}
                loadingButtonTitle={isEdit ? "Updating Invoice please wait..." : "Creating Invoice please wait..."}
              />
            </div>
          </section>
        </aside>
      </form>
    </div>
  );
}
