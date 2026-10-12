// components/backoffice/CustomDataTable.jsx
import Link from "next/link";
import { ChevronLeft, ChevronRight, Eye, ShoppingCart } from "lucide-react";
import { statusMeta, tones } from "./dashboardTones";
import { formatDateTime, formatNumber, formatUGX } from "@/lib/format";

function buildHref(page, status) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return `/dashboard${query ? `?${query}` : ""}#recent-orders`;
}

function paymentState(order) {
  const paid = order.payments
    .filter((payment) => payment.status === "PAID" || payment.status === "PARTIAL")
    .reduce((sum, payment) => sum + payment.amount, 0);
  if (paid >= order.total && order.total > 0) return { label: "Paid", tone: "green" };
  if (paid > 0) return { label: "Partial", tone: "orange" };
  return { label: "Unpaid", tone: "red" };
}

export default function CustomDataTable({ ordersPage, statusCounts, totalOrders, showMoney }) {
  const { orders, total, page, pageSize, totalPages, status } = ordersPage;
  const startIndex = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, total);
  const firstPage = Math.max(1, Math.min(page - 2, totalPages - 4));
  const lastPage = Math.min(totalPages, firstPage + 4);
  const pages = Array.from({ length: lastPage - firstPage + 1 }, (_, index) => firstPage + index);

  const filters = [
    { value: "", label: "All", count: totalOrders },
    ...Object.keys(statusMeta).map((key) => ({
      value: key,
      label: statusMeta[key].label,
      count: statusCounts[key] || 0,
    })),
  ];

  return (
    <section
      id="recent-orders"
      className="mt-6 scroll-mt-24 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700"
    >
      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-50">Recent Orders</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Newest first, straight from the database</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => {
            const active = filter.value === status;
            return (
              <Link
                key={filter.label}
                href={buildHref(1, filter.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-900"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                }`}
              >
                {filter.label} <span className="opacity-70">({formatNumber(filter.count)})</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl ring-1 ring-slate-200 dark:ring-slate-700">
        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-700/60 dark:text-slate-400">
            <tr>
              <th scope="col" className="px-5 py-3">Order</th>
              <th scope="col" className="px-5 py-3">Customer</th>
              <th scope="col" className="px-5 py-3">Items</th>
              <th scope="col" className="px-5 py-3">Status</th>
              {showMoney && <th scope="col" className="px-5 py-3">Total</th>}
              {showMoney && <th scope="col" className="px-5 py-3">Payment</th>}
              <th scope="col" className="px-5 py-3">Date</th>
              <th scope="col" className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {orders.length === 0 && (
              <tr>
                <td colSpan={showMoney ? 8 : 6} className="px-5 py-12 text-center text-slate-500 dark:text-slate-400">
                  No orders found
                </td>
              </tr>
            )}
            {orders.map((order) => {
              const meta = statusMeta[order.status];
              const pay = showMoney ? paymentState(order) : null;
              return (
                <tr key={order.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/40">
                  <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-800 dark:text-slate-50">
                    {order.orderNumber}
                  </td>
                  <td className="px-5 py-4">
                    <p className="whitespace-nowrap font-medium text-slate-800 dark:text-slate-100">
                      {order.customer?.name || "Walk-in customer"}
                    </p>
                    <p className="whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                      {order.customer?.email || order.phone}
                    </p>
                  </td>
                  <td className="px-5 py-4">{formatNumber(order._count.items)}</td>
                  <td className="px-5 py-4">
                    <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${tones[meta.tone].chip}`}>
                      {meta.label}
                    </span>
                  </td>
                  {showMoney && (
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-800 dark:text-slate-50">
                      {formatUGX(order.total)}
                    </td>
                  )}
                  {showMoney && (
                    <td className="px-5 py-4">
                      <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${tones[pay.tone].chip}`}>
                        {pay.label}
                      </span>
                    </td>
                  )}
                  <td className="whitespace-nowrap px-5 py-4 text-xs">{formatDateTime(order.createdAt)}</td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <nav
        className="flex flex-col items-center justify-between gap-3 pt-4 md:flex-row"
        aria-label="Table navigation"
      >
        <span className="text-sm text-slate-500 dark:text-slate-400">
          Showing{" "}
          <span className="font-semibold text-slate-800 dark:text-slate-50">
            {formatNumber(startIndex)}-{formatNumber(endIndex)}
          </span>{" "}
          of <span className="font-semibold text-slate-800 dark:text-slate-50">{formatNumber(total)}</span> orders
        </span>

        <ul className="inline-flex items-center gap-1 text-sm">
          <li>
            {page > 1 ? (
              <Link
                href={buildHref(page - 1, status)}
                className="flex h-9 items-center gap-1 rounded-lg px-3 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </Link>
            ) : (
              <span className="flex h-9 items-center gap-1 rounded-lg px-3 text-slate-300 dark:text-slate-600">
                <ChevronLeft className="h-4 w-4" /> Previous
              </span>
            )}
          </li>
          {pages.map((number) => (
            <li key={number}>
              <Link
                href={buildHref(number, status)}
                aria-current={number === page ? "page" : undefined}
                className={`flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg px-2 font-medium ${
                  number === page
                    ? "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-900"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                {number}
              </Link>
            </li>
          ))}
          <li>
            {page < totalPages ? (
              <Link
                href={buildHref(page + 1, status)}
                className="flex h-9 items-center gap-1 rounded-lg px-3 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Next <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className="flex h-9 items-center gap-1 rounded-lg px-3 text-slate-300 dark:text-slate-600">
                Next <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </li>
        </ul>
      </nav>
    </section>
  );
}