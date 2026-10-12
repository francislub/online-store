// Route: /dashboard/expenses/update/[id]
// File: src/app/(backoffice)/dashboard/expenses/update/[id]/page.jsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ExpenseForm from "@/components/backoffice/ExpenseForm";
import { makeGetRequest } from "@/lib/apiRequest";

export default function UpdateExpense() {
  const { id } = useParams();
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadExpense() {
      const data = await makeGetRequest(`/api/expenses/${id}`);
      setExpense(data);
      setLoading(false);
    }
    if (id) loadExpense();
  }, [id]);

  if (loading) {
    return <p className="p-6 text-center">Loading expense...</p>;
  }

  if (!expense) {
    return <p className="p-6 text-center">Expense not found</p>;
  }

  return <ExpenseForm expense={expense} />;
}