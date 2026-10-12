// app/dashboard/staff/new/page.jsx
import React from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import FormHeader from "@/components/backoffice/FormHeader";
import StaffForm from "@/components/backoffice/StaffForm";

export const dynamic = "force-dynamic";

export default async function NewStaff() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div>
      <FormHeader title="New Staff" />
      <StaffForm />
    </div>
  );
}