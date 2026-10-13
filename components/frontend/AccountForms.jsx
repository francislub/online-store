// src/components/frontend/AccountForms.jsx
"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useCustomer } from "@/context/CustomerContext";

const inputCls =
  "w-full rounded-md border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

// only allow internal redirects like /checkout, never //evil.com
const safeNext = (v) => (v && v.startsWith("/") && !v.startsWith("//") ? v : "/account");

function Field({ id, label, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}

export default function AccountForms() {
  const router = useRouter();
  const params = useSearchParams();
  const { login, register } = useCustomer();

  const [tab, setTab] = useState(params.get("tab") === "register" ? "register" : "login");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const isRegister = tab === "register";

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (isRegister) {
      if (form.password.length < 8) return setError("Password must be at least 8 characters");
      if (form.password !== form.confirm) return setError("Passwords do not match");
    }

    setBusy(true);
    const res = isRegister
      ? await register({ name: form.name, email: form.email, phone: form.phone, password: form.password })
      : await login(form.email, form.password);
    setBusy(false);

    if (!res.ok) {
      if (res.code === "EMAIL_EXISTS") setTab("login");
      return setError(res.message);
    }
    router.push(safeNext(params.get("next")));
    router.refresh();
  };

  return (
    <div className="mx-auto w-full max-w-md rounded-xl bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-6 grid grid-cols-2 rounded-lg bg-gray-100 p-1">
        {[["login", "Login"], ["register", "Register"]].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => { setTab(key); setError(""); }}
            className={`rounded-md py-2 text-sm font-semibold transition ${
              tab === key ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {isRegister && (
          <Field id="acc-name" label="Full name">
            <input id="acc-name" required value={form.name} onChange={set("name")} className={inputCls} autoComplete="name" />
          </Field>
        )}
        <Field id="acc-email" label="Email">
          <input id="acc-email" type="email" required value={form.email} onChange={set("email")} className={inputCls} autoComplete="email" />
        </Field>
        {isRegister && (
          <Field id="acc-phone" label="Phone (optional)">
            <input id="acc-phone" type="tel" value={form.phone} onChange={set("phone")} className={inputCls} placeholder="07xx xxx xxx" autoComplete="tel" />
          </Field>
        )}
        <Field id="acc-pass" label="Password">
          <div className="relative">
            <input
              id="acc-pass"
              type={showPass ? "text" : "password"}
              required
              minLength={isRegister ? 8 : 1}
              value={form.password}
              onChange={set("password")}
              className={`${inputCls} pr-10`}
              autoComplete={isRegister ? "new-password" : "current-password"}
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
          {isRegister && <p className="mt-1 text-xs text-gray-500">At least 8 characters</p>}
        </Field>
        {isRegister && (
          <Field id="acc-confirm" label="Confirm password">
            <input id="acc-confirm" type={showPass ? "text" : "password"} required value={form.confirm} onChange={set("confirm")} className={inputCls} autoComplete="new-password" />
          </Field>
        )}

        {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {busy && <Loader2 size={16} className="animate-spin" />}
          {isRegister ? "Create Account" : "Login"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-500">
        {isRegister ? "Already have an account?" : "New here?"}{" "}
        <button type="button" onClick={() => { setTab(isRegister ? "login" : "register"); setError(""); }} className="font-semibold text-blue-600 hover:underline">
          {isRegister ? "Login" : "Create an account"}
        </button>
      </p>
    </div>
  );
}