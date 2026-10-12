// app/dashboard/staff/update/[id]/page.jsx
import React from "react";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import db from "@/lib/db";
import { authOptions, STAFF_ROLES, publicUserSelect } from "@/lib/auth";
import { isValidId } from "@/lib/staff";
import FormHeader from "@/components/backoffice/FormHeader";
import StaffForm from "@/components/backoffice/StaffForm";

export const dynamic = "force-dynamic";

export default async function UpdateStaff({ params }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const { id } = await params;
  if (!isValidId(id)) notFound();

  const member = await db.user.findUnique({ where: { id }, select: publicUserSelect });
  if (!member || !STAFF_ROLES.includes(member.role)) notFound();

  const initialData = {
    id: member.id,
    name: member.name,
    email: member.email,
    phone: member.phone,
    role: member.role,
    isActive: member.isActive,
  };

  return (
    <div>
      <FormHeader title="Update Staff" />
      <StaffForm initialData={initialData} isSelf={member.id === session.user.id} />
    </div>
  );
}