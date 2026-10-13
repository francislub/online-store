// src/components/frontend/AccountView.jsx
// Route: n/a. Shows the login/register forms or the dashboard depending on session.
"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { useCustomer } from "@/context/CustomerContext";
import AccountForms from "./AccountForms";
import AccountDashboard from "./AccountDashboard";

export default function AccountView() {
  const { customer, loading } = useCustomer();

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-gray-400">
        <Loader2 className="animate-spin" />
      </div>
    );
  }
  return customer ? <AccountDashboard /> : <AccountForms />;
}