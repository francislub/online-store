// Route: /dashboard/returns/[id]
// File: src/app/(backoffice)/dashboard/returns/[id]/page.jsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Pencil } from "lucide-react";
import PageHeader from "@/components/backoffice/PageHeader";
import StatusBadge from "@/components/backoffice/StatusBadge";
import FormField, { inputClass } from "@/components/backoffice/FormField";
import { makeGetRequest, makePutRequest } from "@/lib/apiRequest";
import { PAYMENT_METHODS, RETURN_TRANSITIONS, prettify } from "@/lib/constants";
import { fmtDate, money } from "@/lib/format";

const card = "rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800";
const th = "px-4 py-3";

// What each workflow step does, shown before the user confirms
const STEP_HELP = {
  APPROVED: "Approve the return so the customer can bring the goods back.",
  REJECTED: "Reject the return. Nothing changes in stock or payments.",
  RECEIVED: "Goods are back in the shop. Good items go back into stock; damaged ones are logged but not restocked.",
  REFUNDED: "Pay the customer back. A refund entry is added to Payments.",
  REPLACED: "Give the customer new units. Stock goes out again for the replacement.",
};

export default function ReturnDetails() {
  const { id } = useParams();
  const [ret, setRet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(null); // status being confirmed
  const [condition, setCondition] = useState("RESTOCK");
  const [method, setMethod] = useState("CASH");
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    const data = await makeGetRequest(`/api/returns/${id}`);
    setRet(data);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    if (id) load();
  }, [id, load]);

  if (loading) return <p className="p-6 text-center">Loading return...</p>;
  if (!ret) return <p className="p-6 text-center">Return not found</p>;

  const next = RETURN_TRANSITIONS[ret.status] ?? [];
  const itemsTotal = ret.items.reduce((sum, i) => sum + i.amount, 0);
  const customer = ret.order?.customer?.name ?? ret.order?.invoice?.customerName ?? "Walk-in";

  async function confirmStep(e) {
    e.preventDefault();
    const payload = { status: step, notes: note };
    if (step === "RECEIVED") payload.condition = condition;
    if (step === "REFUNDED") payload.method = method;
    const result = await makePutRequest(setBusy, `/api/returns/${id}`, payload, "Return");
    if (result) {
      setStep(null);
      setNote("");
      load();
    }
  }

  return (
    <div>
      <PageHeader heading={`Return ${ret.reference}`} href="/dashboard/returns/new" linkTitle="New Return" />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <StatusBadge value={ret.status} />
        <span className="text-sm text-gray-500">Requested {fmtDate(ret.createdAt)}</span>
        <div className="ml-auto flex flex-wrap gap-2">
          {["REQUESTED", "APPROVED"].includes(ret.status) && (
            <Link href={`/dashboard/returns/update/${ret.id}`} className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Pencil className="h-4 w-4" /> Edit
            </Link>
          )}
        </div>
      </div>

      {/* Workflow */}
      {next.length > 0 && (
        <div className={`${card} mt-4`}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-2 text-sm font-medium text-gray-900 dark:text-white">Next step:</span>
            {next.map((s) => (
              <button
                key={s}
                type="button"
                disabled={busy}
                onClick={() => setStep(step === s ? null : s)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium capitalize disabled:opacity-60 ${
                  s === "REJECTED"
                    ? "bg-red-50 text-red-700 ring-1 ring-red-200 hover:bg-red-100"
                    : step === s
                    ? "bg-lime-600 text-white"
                    : "bg-lime-50 text-lime-800 ring-1 ring-lime-200 hover:bg-lime-100"
                }`}
              >
                {prettify(s)}
              </button>
            ))}
          </div>

          {step && (
            <form onSubmit={confirmStep} className="mt-4 border-t pt-4 dark:border-gray-700">
              <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">{STEP_HELP[step]}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {step === "RECEIVED" && (
                  <FormField label="Condition of returned goods">
                    <select value={condition} onChange={(e) => setCondition(e.target.value)} className={inputClass}>
                      <option value="RESTOCK">Good, put back in stock</option>
                      <option value="DAMAGED">Damaged, do not restock</option>
                    </select>
                  </FormField>
                )}
                {step === "REFUNDED" && (
                  <>
                    <FormField label="Refund method">
                      <select value={method} onChange={(e) => setMethod(e.target.value)} className={inputClass}>
                        {PAYMENT_METHODS.map((m) => (
                          <option key={m} value={m}>{prettify(m)}</option>
                        ))}
                      </select>
                    </FormField>
                    <div className="self-end text-sm text-gray-700 dark:text-gray-300">
                      Refund amount: <span className="font-semibold">{money(ret.refundAmount)}</span>
                    </div>
                  </>
                )}
                <FormField label="Note (optional)" className="sm:col-span-2">
                  <input type="text" value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} />
                </FormField>
              </div>
              <button type="submit" disabled={busy} className="mt-4 rounded-lg bg-lime-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-lime-700 disabled:opacity-60">
                {busy ? "Saving please wait..." : `Mark as ${prettify(step)}`}
              </button>
            </form>
          )}
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className={`${card} lg:col-span-2`}>
          <h3 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">Returned items</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
              <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th className={th}>Product</th>
                  <th className={th}>Qty</th>
                  <th className={`${th} text-right`}>Value</th>
                </tr>
              </thead>
              <tbody>
                {ret.items.map((item) => (
                  <tr key={item.id} className="border-b dark:border-gray-700">
                    <td className={th}>
                      <div className="font-medium text-gray-900 dark:text-white">{item.product?.name ?? "Deleted product"}</div>
                      <div className="text-xs">{item.product?.sku}</div>
                    </td>
                    <td className={th}>{item.quantity}</td>
                    <td className={`${th} text-right font-medium text-gray-900 dark:text-white`}>{money(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 ml-auto max-w-xs space-y-1 text-sm">
            <div className="flex justify-between"><span>Items value</span><span>{money(itemsTotal)}</span></div>
            {itemsTotal !== ret.refundAmount && (
              <div className="flex justify-between"><span>Deductions</span><span>- {money(itemsTotal - ret.refundAmount)}</span></div>
            )}
            <div className="flex justify-between border-t pt-2 text-base font-bold text-gray-900 dark:text-white">
              <span>Refund</span><span>{money(ret.refundAmount)}</span>
            </div>
          </div>
        </div>

        <div className={card}>
          <h3 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">Details</h3>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-xs text-gray-500">Order</dt>
              <dd>
                <Link href={`/dashboard/orders/${ret.order.id}`} className="font-medium text-blue-600 hover:underline">{ret.order.orderNumber}</Link>
              </dd>
            </div>
            <div><dt className="text-xs text-gray-500">Customer</dt><dd className="font-medium text-gray-900 dark:text-white">{customer}</dd></div>
            <div><dt className="text-xs text-gray-500">Phone</dt><dd>{ret.order.customer?.phone ?? ret.order.phone}</dd></div>
            <div><dt className="text-xs text-gray-500">Reason</dt><dd>{ret.reason}</dd></div>
            {ret.notes && <div><dt className="text-xs text-gray-500">Notes</dt><dd className="whitespace-pre-wrap">{ret.notes}</dd></div>}
          </dl>
        </div>
      </div>
    </div>
  );
}
