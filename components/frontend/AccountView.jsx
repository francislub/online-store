// src/components/frontend/AccountView.jsx
// Route: /account
// Shows the login/register forms or the dashboard depending on session.
// A signed-in customer who lands here with ?callbackUrl=/checkout is sent straight back,
// so their saved details are used automatically instead of showing the login form again.
"use client";

import React, { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useCustomer } from "@/context/CustomerContext";
import AccountForms from "./AccountForms";
import AccountDashboard from "./AccountDashboard";

// Only internal redirects (never //evil.com), and never back to /account itself.
const safeCallback = (v) =>
  v && v.startsWith("/") && !v.startsWith("//") && !v.startsWith("/\\") && !v.startsWith("/account") ? v : null;

function Spinner() {
  return (
    <div className="flex justify-center py-20 text-gray-400" role="status" aria-label="Loading your account">
      <Loader2 className="animate-spin" />
    </div>
  );
}

export default function AccountView() {
  const router = useRouter();
  const params = useSearchParams();
  const { customer, loading } = useCustomer();

  const callback = safeCallback(params.get("callbackUrl") || params.get("next"));

  useEffect(() => {
    if (!loading && customer && callback) router.replace(callback);
  }, [loading, customer, callback, router]);

  if (loading) return <Spinner />;
  if (customer && callback) return <Spinner />; // redirect in flight
  return customer ? <AccountDashboard /> : <AccountForms />;
}