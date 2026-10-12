// app/dashboard/staff/page.jsx
import React from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Ban, Briefcase, CreditCard, ShieldCheck, Warehouse } from "lucide-react";
import db from "@/lib/db";
import { authOptions, STAFF_ROLES, publicUserSelect } from "@/lib/auth";
import { buildStaffWhere } from "@/lib/staff";
import { formatNumber } from "@/lib/format";
import PageHeader from "@/components/backoffice/PageHeader";
import SmallCards from "@/components/backoffice/SmallCards";
import StaffTable from "@/components/backoffice/StaffTable";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

export default async function Staff({ searchParams }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const params = await searchParams;
  const query = (params?.q || "").trim();
  const roleFilter = STAFF_ROLES.includes(params?.role) ? params.role : "";
  const requestedPage = Math.max(1, parseInt(params?.page, 10) || 1);
  const where = buildStaffWhere(query, roleFilter);

  const [total, roleGroups, inactive] = await Promise.all([
    db.user.count({ where }),
    db.user.groupBy({
      by: ["role"],
      where: { role: { in: STAFF_ROLES } },
      _count: { _all: true },
    }),
    db.user.count({ where: { role: { in: STAFF_ROLES }, isActive: false } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);

  const members = await db.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: publicUserSelect,
  });

  const staff = members.map((member) => ({
    ...member,
    createdAt: member.createdAt.toISOString(),
    updatedAt: member.updatedAt.toISOString(),
  }));

  const countFor = (role) => roleGroups.find((group) => group.role === role)?._count?._all || 0;

  const summary = [
    { title: "Administrators", value: formatNumber(countFor("ADMIN")), icon: ShieldCheck, tone: "purple" },
    { title: "Cashiers", value: formatNumber(countFor("CASHIER")), icon: CreditCard, tone: "green" },
    { title: "Sales", value: formatNumber(countFor("SALES")), icon: Briefcase, tone: "blue" },
    { title: "Storekeepers", value: formatNumber(countFor("STOREKEEPER")), icon: Warehouse, tone: "orange" },
    { title: "Inactive", value: formatNumber(inactive), icon: Ban, tone: "red" },
  ];

  return (
    <div>
      <PageHeader heading="Staff" href="/dashboard/staff/new" linkTitle="Add Staff" />

      <SmallCards items={summary} className="grid-cols-2 md:grid-cols-3 xl:grid-cols-5" />

      <div className="py-3">
        <StaffTable
          staff={staff}
          total={total}
          page={page}
          pageSize={PAGE_SIZE}
          totalPages={totalPages}
          query={query}
          roleFilter={roleFilter}
          currentUserId={session.user.id}
        />
      </div>
    </div>
  );
}