// File: app/(back-office)/dashboard/page.jsx

import React from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import {
  AlertTriangle,
  Ban,
  CalendarDays,
  CheckCheck,
  ClipboardList,
  Clock,
  CreditCard,
  FileText,
  History,
  Layers,
  Package,
  PackageX,
  Boxes,
  Receipt,
  RefreshCcw,
  ShoppingCart,
  TrendingUp,
  Truck,
  Undo2,
  Users,
  Wallet,
} from "lucide-react";

import { authOptions } from "@/lib/auth";
import { SCOPES, getDashboardData, getOrdersPage } from "@/lib/dashboard";
import { formatNumber, formatUGX } from "@/lib/format";

import Heading from "@/components/backoffice/Heading";
import LargeCards from "@/components/backoffice/LargeCards";
import SmallCards from "@/components/backoffice/SmallCards";
import DashboardCharts from "@/components/backoffice/DashboardCharts";
import CustomDataTable from "@/components/backoffice/CustomDataTable";
import LowStockPanel from "@/components/backoffice/LowStockPanel";
import RecentCustomersPanel from "@/components/backoffice/RecentCustomersPanel";
import PaymentsPanel from "@/components/backoffice/PaymentsPanel";
import ActivityPanel from "@/components/backoffice/ActivityPanel";

export const dynamic = "force-dynamic";

/* =========================================
   Large Dashboard Statistics
========================================= */

function buildLargeStats(data) {
  if (data.money) {
    const { today, yesterday, month, allTime } = data.money;

    let trend = "";

    if (yesterday.total > 0) {
      const percentage = Math.round(
        ((today.total - yesterday.total) / yesterday.total) * 100
      );

      trend = ` · ${percentage >= 0 ? "▲" : "▼"} ${Math.abs(
        percentage
      )}% vs yesterday`;
    }

    const monthName = new Date().toLocaleString("en-US", {
      month: "long",
      timeZone: "Africa/Kampala",
    });

    return [
      {
        period: "Today's Sales",
        value: formatUGX(today.total),
        hint: `${formatNumber(today.count)} orders${trend}`,
        tone: "green",
        icon: CalendarDays,
      },
      {
        period: "Yesterday's Sales",
        value: formatUGX(yesterday.total),
        hint: `${formatNumber(yesterday.count)} orders`,
        tone: "blue",
        icon: History,
      },
      {
        period: `${monthName} Sales`,
        value: formatUGX(month.total),
        hint: `${formatNumber(month.count)} orders this month`,
        tone: "orange",
        icon: TrendingUp,
      },
      {
        period: "All-Time Sales",
        value: formatUGX(allTime.total),
        hint: `${formatNumber(allTime.count)} orders in total`,
        tone: "purple",
        icon: Layers,
      },
    ];
  }

  const inventory = data.inventory;

  if (!inventory) {
    return [];
  }

  return [
    {
      period: "Orders To Pack",
      value: formatNumber(
        data.statusCounts.PENDING + data.statusCounts.PROCESSING
      ),
      hint: "Pending and processing orders",
      tone: "green",
      icon: ClipboardList,
    },
    {
      period: "Out For Delivery",
      value: formatNumber(data.statusCounts.SHIPPED),
      hint: "Orders already shipped",
      tone: "blue",
      icon: Truck,
    },
    {
      period: "Units In Stock",
      value: formatNumber(inventory.units),
      hint: `Across ${formatNumber(inventory.products)} active products`,
      tone: "teal",
      icon: Boxes,
    },
    {
      period: "Needs Restocking",
      value: formatNumber(inventory.lowStock + inventory.outOfStock),
      hint: `${formatNumber(inventory.outOfStock)} completely out of stock`,
      tone: "orange",
      icon: AlertTriangle,
    },
  ];
}

/* =========================================
   Order Status Statistics
========================================= */

function buildStatusStats(data) {
  const total = data.totalOrders;
  const counts = data.statusCounts;

  const share = (count) => (total > 0 ? (count / total) * 100 : 0);

  return [
    {
      title: "Total Orders",
      value: formatNumber(total),
      icon: ShoppingCart,
      tone: "slate",
      share: 100,
    },
    {
      title: "Pending",
      value: formatNumber(counts.PENDING),
      icon: Clock,
      tone: "orange",
      share: share(counts.PENDING),
    },
    {
      title: "Processing",
      value: formatNumber(counts.PROCESSING),
      icon: RefreshCcw,
      tone: "blue",
      share: share(counts.PROCESSING),
    },
    {
      title: "Shipped",
      value: formatNumber(counts.SHIPPED),
      icon: Truck,
      tone: "purple",
      share: share(counts.SHIPPED),
    },
    {
      title: "Completed",
      value: formatNumber(counts.COMPLETED),
      icon: CheckCheck,
      tone: "green",
      share: share(counts.COMPLETED),
    },
    {
      title: "Cancelled",
      value: formatNumber(counts.CANCELLED),
      icon: Ban,
      tone: "red",
      share: share(counts.CANCELLED),
    },
  ];
}

/* =========================================
   Role-Based Overview Statistics
========================================= */

function buildOverviewStats(role, data) {
  const returns = {
    title: "Open Returns",
    value: formatNumber(data.pendingReturns),
    icon: Undo2,
    tone: "red",
    hint: "Requested or approved",
  };

  const customers = data.customers
    ? {
        title: "Customers",
        value: formatNumber(data.customers.count),
        icon: Users,
        tone: "blue",
        hint: "Registered accounts",
      }
    : null;

  if (role === "ADMIN") {
    const inventory = data.inventory;
    const finance = data.finance;
    const profit = data.profit;

    return [
      customers,

      inventory
        ? {
            title: "Active Products",
            value: formatNumber(inventory.products),
            icon: Package,
            tone: "green",
            hint: `${formatNumber(inventory.units)} units in stock`,
          }
        : null,

      inventory
        ? {
            title: "Low Stock",
            value: formatNumber(inventory.lowStock),
            icon: AlertTriangle,
            tone: "orange",
            hint: "At or below reorder level",
          }
        : null,

      inventory
        ? {
            title: "Out Of Stock",
            value: formatNumber(inventory.outOfStock),
            icon: PackageX,
            tone: "red",
            hint: "Needs restocking now",
          }
        : null,

      finance
        ? {
            title: "Receivables",
            value: formatUGX(finance.receivables.total),
            icon: Receipt,
            tone: "teal",
            hint: `${formatNumber(finance.receivables.count)} unpaid invoices`,
          }
        : null,

      {
        title: "Expenses This Month",
        value: formatUGX(profit.expenses),
        icon: Wallet,
        tone: "purple",
        hint: "Recorded business expenses",
      },

      {
        title: "Net Profit This Month",
        value: formatUGX(profit.net),
        icon: TrendingUp,
        tone: profit.net >= 0 ? "green" : "red",
        hint: `Gross profit ${formatUGX(profit.gross)}`,
      },

      returns,
    ];
  }

  if (role === "CASHIER") {
    const finance = data.finance;

    return [
      customers,

      finance
        ? {
            title: "Receivables",
            value: formatUGX(finance.receivables.total),
            icon: Receipt,
            tone: "teal",
            hint: `${formatNumber(finance.receivables.count)} unpaid invoices`,
          }
        : null,

      finance
        ? {
            title: "Overdue Invoices",
            value: formatNumber(finance.overdue),
            icon: AlertTriangle,
            tone: "red",
            hint: "Past their due date",
          }
        : null,

      finance
        ? {
            title: "Payments This Month",
            value: formatUGX(finance.paymentsMonth.total),
            icon: CreditCard,
            tone: "green",
            hint: `${formatNumber(finance.paymentsMonth.count)} payments`,
          }
        : null,

      returns,
    ];
  }

  if (role === "SALES") {
    return [
      customers,
      {
        title: "Open Quotes",
        value: formatNumber(data.openQuotes),
        icon: FileText,
        tone: "purple",
        hint: "Draft or sent to customers",
      },
      returns,
    ];
  }

  const inventory = data.inventory;

  return [
    inventory
      ? {
          title: "Active Products",
          value: formatNumber(inventory.products),
          icon: Package,
          tone: "green",
          hint: `${formatNumber(inventory.units)} units in stock`,
        }
      : null,

    inventory
      ? {
          title: "Out Of Stock",
          value: formatNumber(inventory.outOfStock),
          icon: PackageX,
          tone: "red",
          hint: "Needs restocking now",
        }
      : null,

    inventory
      ? {
          title: "Stock Value (Cost)",
          value: formatUGX(inventory.costValue),
          icon: Boxes,
          tone: "teal",
          hint: "At purchase cost",
        }
      : null,

    inventory
      ? {
          title: "Open Purchase Orders",
          value: formatNumber(inventory.pendingPurchases),
          icon: ClipboardList,
          tone: "purple",
          hint: "Ordered, not yet received",
        }
      : null,

    inventory
      ? {
          title: "Suppliers",
          value: formatNumber(inventory.suppliers),
          icon: Truck,
          tone: "blue",
          hint: `Balance owed ${formatUGX(inventory.supplierBalance)}`,
        }
      : null,

    returns,
  ];
}

/* =========================================
   Dashboard Page
========================================= */

export default async function DashboardPage({ searchParams }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/admin/login");
  }

  const role = session.user.role;

  if (!SCOPES[role]) {
    redirect("/");
  }

  const params = searchParams ? await searchParams : {};

  const [data, ordersPage] = await Promise.all([
    getDashboardData(role),
    getOrdersPage({
      page: params.page,
      status: params.status,
    }),
  ]);

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Kampala",
  });

  const showPanels =
    Boolean(data.inventory) ||
    Boolean(data.customers) ||
    Boolean(data.finance) ||
    data.activity.length > 0 ||
    SCOPES[role].activity;

  const overviewItems = buildOverviewStats(role, data).filter(
    (item) => item !== null
  );

  return (
    <div>
      <Heading
        title="Dashboard Overview"
        subtitle={`Welcome back, ${session.user.name}. ${today}`}
        badge={role.toLowerCase()}
      />

      <LargeCards items={buildLargeStats(data)} />

      <SmallCards items={buildStatusStats(data)} />

      <SmallCards
        items={overviewItems}
        className="grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
      />

      <DashboardCharts
        weekly={data.weekly}
        topProducts={data.topProducts}
        statusCounts={data.statusCounts}
        totalOrders={data.totalOrders}
        showMoney={Boolean(data.money)}
      />

      {showPanels && (
        <div className="grid grid-cols-1 gap-4 py-3 lg:grid-cols-2 xl:grid-cols-4">
          {data.inventory && (
            <LowStockPanel
              items={data.inventory.attention}
              lowCount={data.inventory.lowStock}
              outCount={data.inventory.outOfStock}
            />
          )}

          {data.customers && (
            <RecentCustomersPanel
              customers={data.customers.recent}
              total={data.customers.count}
            />
          )}

          {data.finance && (
            <PaymentsPanel
              total={data.finance.paymentsMonth.total}
              count={data.finance.paymentsMonth.count}
              byMethod={data.finance.byMethod}
            />
          )}

          {SCOPES[role].activity && <ActivityPanel items={data.activity} />}
        </div>
      )}

      <CustomDataTable
        ordersPage={ordersPage}
        statusCounts={data.statusCounts}
        totalOrders={data.totalOrders}
        showMoney={Boolean(data.money)}
      />
    </div>
  );
}