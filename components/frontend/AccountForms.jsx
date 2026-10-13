// src/components/frontend/AccountForms.jsx
// Route: n/a. Login / register for customers who are not signed in.
// Accepts ?tab=register and ?callbackUrl=/checkout (legacy ?next= also works).
"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Eye, EyeOff, Loader2, MapPin, Package, ShoppingBag } from "lucide-react";
import { useCustomer } from "@/context/CustomerContext";

const inputBase =
  "w-full rounded-md border bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

// Only allow internal redirects like /checkout, never //evil.com or /\evil.com
const safeNext = (v) =>
  v && v.startsWith("/") && !v.startsWith("//") && !v.startsWith("/\\") ? v : "/account";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function passwordScore(p) {
  let s = 0;
  if (p.length >= 8) s++;
  if (p.length >= 12) s++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
  if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) s++;
  return Math.min(s, 3);
}
const STRENGTH = [
  { label: "Too weak", cls: "bg-red-400" },
  { label: "Fair", cls: "bg-amber-400" },
  { label: "Good", cls: "bg-lime-500" },
  { label: "Strong", cls: "bg-green-600" },
];

function Field({ id, label, error, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>
      )}
    </div>
  );
}

const BENEFITS = [
  [Package, "Track every order", "See status updates and invoices in one place."],
  [MapPin, "Save delivery addresses", "Check out faster with your details already filled in."],
  [ShoppingBag, "Your cart is kept", "Whatever you've added stays with you when you sign in."],
];

export default function AccountForms() {
  const router = useRouter();
  const params = useSearchParams();
  const { login, register } = useCustomer();

  const target = safeNext(params.get("callbackUrl") || params.get("next"));
  const fromCheckout = target.startsWith("/checkout");
  const urlTab = params.get("tab") === "register" ? "register" : "login";

  const [tab, setTab] = useState(urlTab);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // header menu links change ?tab= while this page stays mounted
  useEffect(() => setTab(urlTab), [urlTab]);

  const isRegister = tab === "register";
  const score = passwordScore(form.password);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (fieldErrors[k]) setFieldErrors((x) => ({ ...x, [k]: undefined }));
  };

  const switchTab = (next) => {
    setTab(next);
    setError("");
    setFieldErrors({});
  };

  function validate() {
    const e = {};
    if (isRegister && !form.name.trim()) e.name = "Enter your full name";
    if (!EMAIL_RE.test(form.email.trim())) e.email = "Enter a valid email address";
    if (isRegister) {
      if (form.phone && form.phone.replace(/\D/g, "").length < 9) e.phone = "Enter a valid phone number";
      if (form.password.length < 8) e.password = "Use at least 8 characters";
      if (form.confirm !== form.password) e.confirm = "Passwords do not match";
    } else if (!form.password) {
      e.password = "Enter your password";
    }
    return e;
  }

  const onSubmit = async (ev) => {
    ev.preventDefault();
    if (busy) return;
    setError("");

    const errs = validate();
    setFieldErrors(errs);
    const first = Object.keys(errs)[0];
    if (first) {
      document.getElementById(`acc-${first}`)?.focus();
      return;
    }

    setBusy(true);
    try {
      const email = form.email.trim().toLowerCase();
      const res = isRegister
        ? await register({ name: form.name.trim(), email, phone: form.phone.trim(), password: form.password })
        : await login(email, form.password);

      if (!res.ok) {
        if (res.code === "EMAIL_EXISTS") {
          setTab("login");
          setError("An account with this email already exists. Enter your password to sign in.");
        } else {
          setError(res.message || "Something went wrong. Please try again.");
        }
        return;
      }
      router.replace(target);
      router.refresh();
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const border = (k) => (fieldErrors[k] ? "border-red-400" : "border-gray-300");
  const aria = (k) => ({
    "aria-invalid": fieldErrors[k] ? true : undefined,
    "aria-describedby": fieldErrors[k] ? `acc-${k}-error` : undefined,
  });

  return (
    <div className="mx-auto grid w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-sm lg:grid-cols-[2fr_3fr]">
      {/* Benefits */}
      <aside className="hidden bg-blue-600 p-8 text-white lg:block">
        <h2 className="text-xl font-semibold">
          {fromCheckout ? "One step before you pay" : isRegister ? "Create your account" : "Welcome back"}
        </h2>
        <p className="mt-2 text-sm text-blue-100">
          {fromCheckout
            ? "Sign in or create an account to finish your order. Your cart is saved."
            : "An account makes shopping with us faster and easier."}
        </p>
        <ul className="mt-8 space-y-6">
          {BENEFITS.map(([Icon, title, text]) => (
            <li key={title} className="flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                <Icon size={18} />
              </span>
              <span>
                <span className="block text-sm font-semibold">{title}</span>
                <span className="block text-sm text-blue-100">{text}</span>
              </span>
            </li>
          ))}
        </ul>
      </aside>

      {/* Form */}
      <div className="p-6 sm:p-8">
        {fromCheckout && (
          <p className="mb-5 rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-800 lg:hidden">
            Sign in or create an account to finish your order. Your cart is saved.
          </p>
        )}

        <div role="tablist" aria-label="Account" className="mb-6 grid grid-cols-2 rounded-lg bg-gray-100 p-1">
          {[
            ["login", "Sign in"],
            ["register", "Create account"],
          ].map(([key, label]) => (
            <button
              key={key}
              role="tab"
              type="button"
              aria-selected={tab === key}
              onClick={() => switchTab(key)}
              className={`rounded-md py-2 text-sm font-semibold transition ${
                tab === key ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} noValidate className="space-y-4">
          {isRegister && (
            <Field id="acc-name" label="Full name" error={fieldErrors.name}>
              <input id="acc-name" value={form.name} onChange={set("name")} autoComplete="name"
                className={`${inputBase} ${border("name")}`} {...aria("name")} />
            </Field>
          )}

          <Field id="acc-email" label="Email" error={fieldErrors.email}>
            <input id="acc-email" type="email" value={form.email} onChange={set("email")} autoComplete="email"
              className={`${inputBase} ${border("email")}`} {...aria("email")} />
          </Field>

          {isRegister && (
            <Field id="acc-phone" label="Phone (optional)" error={fieldErrors.phone} hint="Used for delivery calls.">
              <input id="acc-phone" type="tel" inputMode="tel" value={form.phone} onChange={set("phone")}
                placeholder="0772 123 456" autoComplete="tel"
                className={`${inputBase} ${border("phone")}`} {...aria("phone")} />
            </Field>
          )}

          <Field id="acc-password" label="Password" error={fieldErrors.password}>
            <div className="relative">
              <input
                id="acc-password"
                type={showPass ? "text" : "password"}
                value={form.password}
                onChange={set("password")}
                autoComplete={isRegister ? "new-password" : "current-password"}
                className={`${inputBase} ${border("password")} pr-10`}
                {...aria("password")}
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                aria-label={showPass ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
              >
                {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {isRegister && form.password && (
              <div className="mt-2 flex items-center gap-2" aria-live="polite">
                <div className="flex flex-1 gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <span key={i} className={`h-1 flex-1 rounded-full ${i <= score ? STRENGTH[score].cls : "bg-gray-200"}`} />
                  ))}
                </div>
                <span className="text-xs text-gray-500">{STRENGTH[score].label}</span>
              </div>
            )}
          </Field>

          {isRegister && (
            <Field id="acc-confirm" label="Confirm password" error={fieldErrors.confirm}>
              <div className="relative">
                <input id="acc-confirm" type={showPass ? "text" : "password"} value={form.confirm}
                  onChange={set("confirm")} autoComplete="new-password"
                  className={`${inputBase} ${border("confirm")}`} {...aria("confirm")} />
                {form.confirm && form.confirm === form.password && (
                  <Check size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600" />
                )}
              </div>
            </Field>
          )}

          {error && (
            <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {busy && <Loader2 size={16} className="animate-spin" />}
            {busy ? (isRegister ? "Creating account…" : "Signing in…") : isRegister ? "Create account" : "Sign in"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-500">
          {isRegister ? "Already have an account?" : "New here?"}{" "}
          <button type="button" onClick={() => switchTab(isRegister ? "login" : "register")}
            className="font-semibold text-blue-600 hover:underline">
            {isRegister ? "Sign in" : "Create an account"}
          </button>
        </p>
      </div>
    </div>
  );
}