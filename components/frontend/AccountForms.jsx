// src/components/frontend/AccountForms.jsx
"use client";

import React, { useState } from "react";

const inputCls =
  "w-full rounded-md border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

export default function AccountForms() {
  const [tab, setTab] = useState("login");
  const [message, setMessage] = useState("");

  const onSubmit = (e) => {
    e.preventDefault();
    // TODO: connect to your auth (NextAuth, custom API, etc.)
    setMessage(tab === "login" ? "Login is not connected yet." : "Registration is not connected yet.");
  };

  return (
    <div className="mx-auto w-full max-w-md rounded-xl bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-6 grid grid-cols-2 rounded-lg bg-gray-100 p-1">
        {[
          ["login", "Login"],
          ["register", "Register"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setTab(key);
              setMessage("");
            }}
            className={`rounded-md py-2 text-sm font-semibold transition ${
              tab === key ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {tab === "register" && (
          <div>
            <label htmlFor="acc-name" className="mb-1.5 block text-sm font-medium text-gray-700">
              Full name
            </label>
            <input id="acc-name" required className={inputCls} />
          </div>
        )}
        <div>
          <label htmlFor="acc-email" className="mb-1.5 block text-sm font-medium text-gray-700">
            Email
          </label>
          <input id="acc-email" type="email" required className={inputCls} />
        </div>
        <div>
          <label htmlFor="acc-pass" className="mb-1.5 block text-sm font-medium text-gray-700">
            Password
          </label>
          <input id="acc-pass" type="password" required minLength={6} className={inputCls} />
        </div>

        {message && <p className="text-sm text-amber-600">{message}</p>}

        <button
          type="submit"
          className="w-full rounded-md bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700"
        >
          {tab === "login" ? "Login" : "Create Account"}
        </button>
      </form>
    </div>
  );
}
