// src/components/frontend/CheckoutView.jsx
// Route: /checkout
"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart, formatUGX } from "@/context/CartContext";
import { useCustomer } from "@/context/CustomerContext";
import { PAYMENT_OPTIONS } from "@/lib/paymentOptions";
import { api } from "@/lib/storefrontApi";

const CALLBACK = "/checkout";
const ACCOUNT_URL = `/account?callbackUrl=${encodeURIComponent(CALLBACK)}`;
const REGISTER_URL = `/account?tab=register&callbackUrl=${encodeURIComponent(CALLBACK)}`;

const inputCls =
  "w-full rounded-md border bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

// Map a saved Address row (label, phone, address, city) to the delivery form.
// The Address model has no name column, so the recipient name stays as the customer's name.
const addressToForm = (a) => ({
  phone: a.phone || "",
  city: a.city || "",
  address: a.address || "",
});

const addressLabel = (a) =>
  [a.label, a.address, a.city].filter(Boolean).join(", ") || "Saved address";

function validate(form) {
  const errs = {};
  if (!form.name.trim()) errs.name = "Enter the recipient's full name";
  const digits = form.phone.replace(/\D/g, "");
  if (!form.phone.trim()) errs.phone = "Enter a phone number we can reach on delivery";
  else if (digits.length < 9 || digits.length > 13) errs.phone = "Enter a valid phone number, e.g. 0772 123 456";
  if (!form.city.trim()) errs.city = "Enter your city or town";
  if (!form.address.trim()) errs.address = "Enter where we should deliver";
  return errs;
}

function Field({ id, label, error, optional, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
        {optional && <span className="ml-1 font-normal text-gray-400">(optional)</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px]" aria-busy="true">
      <div className="h-96 animate-pulse rounded-xl bg-gray-200" />
      <div className="h-80 animate-pulse rounded-xl bg-gray-200" />
    </div>
  );
}

export default function CheckoutView() {
  const router = useRouter();
  const { items, subtotal, clear, updateQty, removeItem, ready } = useCart();
  const { customer, loading: customerLoading } = useCustomer();
  // `ready` is exposed by CartContext once localStorage has been read.
  // If it isn't exposed yet, treat the cart as ready.
  const cartReady = ready !== false;

  const [form, setForm] = useState({ name: "", phone: "", city: "", address: "", notes: "" });
  const [errors, setErrors] = useState({});
  const [addresses, setAddresses] = useState([]);
  const [addressId, setAddressId] = useState("new"); // saved address id, or "new"
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [saveAddress, setSaveAddress] = useState(true); // save a new address to the account after ordering
  const [payment, setPayment] = useState(() => Object.keys(PAYMENT_OPTIONS)[0] || "cod");

  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState(null); // { code, title, discount }
  const [couponMsg, setCouponMsg] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const errorRef = useRef(null);
  const prefilled = useRef(false);

  const cartPayload = items.map((i) => ({ productId: i.id, qty: i.qty }));
  const discount = coupon?.discount || 0;
  const total = Math.max(0, subtotal - discount);

  // Not signed in (and there is something to buy): send them to the account page.
  useEffect(() => {
    if (cartReady && !customerLoading && !customer && items.length > 0 && !submitting) {
      router.replace(ACCOUNT_URL);
    }
  }, [cartReady, customerLoading, customer, items.length, submitting, router]);

  // Signed in: fill the form from the customer's account, then load saved addresses.
  useEffect(() => {
    if (!customer || prefilled.current) return;
    prefilled.current = true;

    setForm((f) => ({
      ...f,
      name: f.name || customer.name || "",
      phone: f.phone || customer.phone || "",
    }));

    let cancelled = false;
    setAddressesLoading(true);
    fetch("/api/storefront/account", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (cancelled) return;
        const list = json?.data?.addresses || [];
        setAddresses(list);
        const pick = list.find((a) => a.isDefault) || list[0];
        if (pick) {
          const v = addressToForm(pick);
          setAddressId(String(pick.id));
          setForm((f) => ({ ...f, phone: v.phone || f.phone, city: v.city, address: v.address }));
        }
      })
      .catch(() => {})
      .finally(() => !cancelled && setAddressesLoading(false));

    return () => {
      cancelled = true;
    };
  }, [customer]);

  // Cart changed: re-check the applied coupon against the new subtotal.
  useEffect(() => {
    if (coupon?.code) validateCoupon(coupon.code, { silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);

  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [error]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((x) => ({ ...x, [name]: undefined }));
    // editing a saved address turns it into a custom one
    if (addressId !== "new" && (name === "city" || name === "address")) setAddressId("new");
  };

  function chooseAddress(id) {
    setAddressId(id);
    setErrors({});
    if (id === "new") {
      setForm((f) => ({ ...f, city: "", address: "" }));
      return;
    }
    const a = addresses.find((x) => String(x.id) === id);
    if (a) {
      const v = addressToForm(a);
      setForm((f) => ({ ...f, phone: v.phone || f.phone, city: v.city, address: v.address }));
    }
  }

  async function validateCoupon(code, { silent = false } = {}) {
    if (!code.trim()) return;
    setCouponBusy(true);
    if (!silent) setCouponMsg("");
    try {
      const res = await fetch("/api/storefront/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, items: cartPayload }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setCoupon(null);
        setCouponMsg(
          silent ? "Your cart changed and the coupon no longer applies" : json?.message || "This coupon isn't valid"
        );
        return;
      }
      setCoupon(json.data);
      setCouponMsg(`${json.data.title} applied`);
    } catch {
      if (!silent) setCouponMsg("Network error, please try again");
    } finally {
      setCouponBusy(false);
    }
  }

  function removeCoupon() {
    setCoupon(null);
    setCouponInput("");
    setCouponMsg("");
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setError("");

    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length) {
      document.getElementById(Object.keys(errs)[0])?.focus();
      return;
    }

    setSubmitting(true);
    try {
      // The customer (who is placing the order) is identified on the server from the
      // signed-in session. Only the delivery details and the cart are sent from here.
      const res = await fetch("/api/storefront/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          name: form.name.trim(),
          phone: form.phone.trim(),
          city: form.city.trim(),
          address: form.address.trim(),
          paymentMethod: payment,
          couponCode: coupon?.code || "",
          items: cartPayload,
        }),
      });
      const json = await res.json().catch(() => null);
      if (res.status === 401) {
        router.replace(ACCOUNT_URL);
        return;
      }
      if (!res.ok) {
        setError(json?.message || "We couldn't place your order. Check your details and try again.");
        setSubmitting(false);
        return;
      }

      // Order is saved. Optionally remember a new delivery address on the account.
      if (addressId === "new" && saveAddress) {
        try {
          await api("/api/storefront/account/addresses", {
            method: "POST",
            body: {
              phone: form.phone.trim(),
              address: form.address.trim(),
              city: form.city.trim(),
              isDefault: addresses.length === 0,
            },
          });
        } catch {
          // never block the confirmation page on this
        }
      }

      clear();
      router.push(`/account/orders/${json.data.orderNumber}?placed=1`);
    } catch (err) {
      console.error("[CheckoutView]", err);
      setError("Network error. Check your connection and try again.");
      setSubmitting(false);
    }
  }

  // ---------- states before the form ----------

  if (!cartReady || customerLoading) return <Skeleton />;

  if (items.length === 0 && !submitting) {
    return (
      <div className="rounded-xl bg-white p-12 text-center shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">Your cart is empty</h2>
        <p className="mt-2 text-gray-500">Add a few products and come back to check out.</p>
        <Link
          href="/products"
          className="mt-6 inline-block rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Browse products
        </Link>
      </div>
    );
  }

  // Redirect is in flight; show a short message instead of a flash of the form.
  if (!customer) {
    return (
      <div className="mx-auto max-w-lg rounded-xl bg-white p-10 text-center shadow-sm" role="status">
        <h2 className="text-xl font-semibold text-gray-900">Sign in to place your order</h2>
        <p className="mt-2 text-gray-500">
          Taking you to your account. Your cart is saved and will be here when you come back.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href={ACCOUNT_URL} className="rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700">
            Sign in
          </Link>
          <Link href={REGISTER_URL} className="rounded-md bg-blue-100 px-6 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-200">
            Create account
          </Link>
        </div>
      </div>
    );
  }

  const borderFor = (name) => (errors[name] ? "border-red-400" : "border-gray-300");
  const aria = (name) => ({
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  });

  return (
    <form id="checkout-form" onSubmit={onSubmit} noValidate className="grid gap-6 pb-24 lg:grid-cols-[1fr_400px] lg:pb-0">
      <div className="space-y-6">
        {/* Customer (the person placing the order) */}
        <section className="rounded-xl bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 text-base font-bold text-white">
                {(customer.name || customer.email || "?").charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-gray-400">Ordering as</p>
                <p className="truncate font-semibold text-gray-900">{customer.name || customer.email}</p>
                <p className="truncate text-sm text-gray-500">
                  {[customer.email, customer.phone].filter(Boolean).join(" · ")}
                </p>
              </div>
            </div>
            <Link href="/account" className="text-sm font-medium text-blue-600 hover:underline">
              Not you? Manage account
            </Link>
          </div>
          <p className="mt-3 rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-800">
            This order will be saved to your account. You can follow it under My orders.
          </p>
        </section>

        {/* Delivery */}
        <section className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Delivery details</h2>
          <p className="text-sm text-gray-500">
            We'll email your confirmation to <span className="font-medium text-gray-800">{customer.email}</span>.
          </p>

          {addressesLoading && <div className="h-16 animate-pulse rounded-md bg-gray-100" />}

          {addresses.length > 0 && (
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-gray-700">Deliver to</legend>
              <div className="space-y-2">
                {addresses.map((a) => {
                  const id = String(a.id);
                  const on = addressId === id;
                  return (
                    <label
                      key={id}
                      className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 transition ${
                        on ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="savedAddress"
                        className="mt-1"
                        checked={on}
                        onChange={() => chooseAddress(id)}
                      />
                      <span className="text-sm text-gray-800">
                        {addressLabel(a)}
                        {a.isDefault && (
                          <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">Default</span>
                        )}
                      </span>
                    </label>
                  );
                })}
                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 transition ${
                    addressId === "new" ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="savedAddress"
                    checked={addressId === "new"}
                    onChange={() => chooseAddress("new")}
                  />
                  <span className="text-sm text-gray-800">Use a different address</span>
                </label>
              </div>
            </fieldset>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="name" label="Recipient name" error={errors.name}>
              <input id="name" name="name" autoComplete="name" value={form.name} onChange={onChange}
                className={`${inputCls} ${borderFor("name")}`} {...aria("name")} />
            </Field>
            <Field id="phone" label="Phone number" error={errors.phone}>
              <input id="phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="0772 123 456"
                value={form.phone} onChange={onChange} className={`${inputCls} ${borderFor("phone")}`} {...aria("phone")} />
            </Field>
          </div>
          <Field id="city" label="City or town" error={errors.city}>
            <input id="city" name="city" autoComplete="address-level2" value={form.city} onChange={onChange}
              className={`${inputCls} ${borderFor("city")}`} {...aria("city")} />
          </Field>
          <Field id="address" label="Delivery address" error={errors.address}>
            <input id="address" name="address" autoComplete="street-address" placeholder="Street, area, landmark"
              value={form.address} onChange={onChange} className={`${inputCls} ${borderFor("address")}`} {...aria("address")} />
          </Field>

          {addressId === "new" && (
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />
              Save this address to my account for next time
            </label>
          )}

          <Field id="notes" label="Order notes" optional>
            <textarea id="notes" name="notes" rows={3} placeholder="Delivery instructions, preferred time…"
              value={form.notes} onChange={onChange} className={`${inputCls} border-gray-300`} />
          </Field>
        </section>

        {/* Payment */}
        <section className="space-y-3 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Payment</h2>
          <fieldset className="space-y-2">
            <legend className="sr-only">Payment method</legend>
            {Object.entries(PAYMENT_OPTIONS).map(([key, o]) => (
              <label
                key={key}
                className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 transition ${
                  payment === key ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <input type="radio" name="payment" className="mt-1" checked={payment === key} onChange={() => setPayment(key)} />
                <span>
                  <span className="block text-sm font-medium text-gray-800">{o.label}</span>
                  <span className="block text-xs text-gray-500">{o.hint}</span>
                </span>
              </label>
            ))}
          </fieldset>
        </section>
      </div>

      {/* Summary */}
      <aside className="h-fit rounded-xl bg-white p-6 shadow-sm lg:sticky lg:top-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Your order</h2>
          <Link href="/products" className="text-sm text-blue-600 hover:underline">
            Add more
          </Link>
        </div>

        <ul className="mt-4 divide-y divide-gray-100">
          {items.map((i) => (
            <li key={i.id} className="flex gap-3 py-3">
              {i.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={i.image} alt="" className="h-14 w-14 shrink-0 rounded-md border border-gray-100 object-cover" />
              ) : (
                <div className="h-14 w-14 shrink-0 rounded-md bg-gray-100" />
              )}
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm text-gray-800">{i.name}</p>
                <div className="mt-1.5 flex items-center justify-between">
                  <div className="inline-flex items-center rounded-md border border-gray-200 text-sm">
                    <button
                      type="button"
                      aria-label={`Decrease quantity of ${i.name}`}
                      onClick={() => updateQty(i.id, i.qty - 1)}
                      disabled={i.qty <= 1}
                      className="px-2.5 py-1 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                    >
                      −
                    </button>
                    <span className="min-w-6 px-1 text-center" aria-live="polite">{i.qty}</span>
                    <button
                      type="button"
                      aria-label={`Increase quantity of ${i.name}`}
                      onClick={() => updateQty(i.id, i.qty + 1)}
                      disabled={i.stock ? i.qty >= i.stock : false}
                      className="px-2.5 py-1 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{formatUGX(i.price * i.qty)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(i.id)}
                  className="mt-1 text-xs text-gray-400 hover:text-red-600"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>

        {/* Coupon */}
        <div className="mt-2 border-t border-gray-100 pt-4">
          {coupon ? (
            <div className="flex items-center justify-between rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
              <span>
                <span className="font-semibold">{coupon.code}</span> · {coupon.title}
              </span>
              <button type="button" onClick={removeCoupon} className="text-xs font-medium underline">
                Remove
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    validateCoupon(couponInput);
                  }
                }}
                aria-label="Coupon code"
                placeholder="Coupon code"
                className={`${inputCls} border-gray-300`}
              />
              <button
                type="button"
                onClick={() => validateCoupon(couponInput)}
                disabled={couponBusy || !couponInput.trim()}
                className="shrink-0 rounded-md bg-blue-100 px-4 text-sm font-semibold text-blue-700 hover:bg-blue-200 disabled:opacity-60"
              >
                {couponBusy ? "Checking…" : "Apply"}
              </button>
            </div>
          )}
          {couponMsg && !coupon && <p className="mt-1.5 text-xs text-red-600" role="alert">{couponMsg}</p>}
        </div>

        <dl className="mt-4 space-y-1.5 border-t border-gray-200 pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">Subtotal</dt>
            <dd className="font-semibold">{formatUGX(subtotal)}</dd>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-green-700">
              <dt>Discount</dt>
              <dd>− {formatUGX(discount)}</dd>
            </div>
          )}
        </dl>
        <div className="mt-3 flex justify-between border-t border-gray-200 pt-3 text-lg font-bold">
          <span>Total</span>
          <span className="text-blue-600">{formatUGX(total)}</span>
        </div>

        <div ref={errorRef} aria-live="assertive">
          {error && <p className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-5 hidden w-full rounded-md bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 lg:block"
        >
          {submitting ? "Placing order…" : `Place order · ${formatUGX(total)}`}
        </button>
        <p className="mt-2 text-center text-xs text-gray-400">
          Final prices and stock are confirmed when you place the order.
        </p>
      </aside>

      {/* Mobile sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-4 border-t border-gray-200 bg-white px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] lg:hidden">
        <div>
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-base font-bold text-blue-600">{formatUGX(total)}</p>
        </div>
        <button
          type="submit"
          form="checkout-form"
          disabled={submitting}
          className="rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? "Placing order…" : "Place order"}
        </button>
      </div>
    </form>
  );
}