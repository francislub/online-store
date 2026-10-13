// components/backoffice/Sidebar.jsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import {
  ArrowLeftRight,
  Boxes,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
  ClipboardList,
  CreditCard,
  ExternalLink,
  FileText,
  LayoutDashboard,
  LayoutList,
  LogOut,
  Mail,
  MonitorPlay,
  Receipt,
  ScrollText,
  Settings,
  ShoppingCart,
  Ticket,
  Truck,
  Undo2,
  UserCog,
  Users,
  Wallet,
  BarChart3,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useUnreadSummary from "@/hooks/useUnreadSummary";

const ADMIN = ["ADMIN"];
const ADMIN_SALES = ["ADMIN", "SALES"];
const ADMIN_STORE = ["ADMIN", "STOREKEEPER"];
const ADMIN_CASH = ["ADMIN", "CASHIER"];
const ADMIN_CASH_SALES = ["ADMIN", "CASHIER", "SALES"];
const EVERYONE = ["ADMIN", "CASHIER", "SALES", "STOREKEEPER"];

// `types` = notification categories (see activityConfig CATEGORIES) shown on this button
// `all`   = this button shows the total unread count and the newest message overall
const navSections = [
  {
    heading: null,
    items: [
      { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard", exact: true, roles: EVERYONE },
    ],
  },
  {
    heading: "Sales",
    items: [
      { title: "Orders", icon: ShoppingCart, href: "/dashboard/orders", roles: EVERYONE, types: ["ORDER"] },
      { title: "Quotes", icon: FileText, href: "/dashboard/quotes", roles: ADMIN_SALES, types: ["QUOTE"] },
      { title: "Invoices", icon: Receipt, href: "/dashboard/invoices", roles: ADMIN_CASH_SALES, types: ["INVOICE"] },
      { title: "Payments", icon: CreditCard, href: "/dashboard/payments", roles: ADMIN_CASH, types: ["PAYMENT"] },
      { title: "Returns", icon: Undo2, href: "/dashboard/returns", roles: EVERYONE, types: ["RETURN"] },
      { title: "Customers", icon: Users, href: "/dashboard/customers", roles: ADMIN_CASH_SALES, types: ["ACCOUNT", "SHOPPING"] },
    ],
  },
  {
    heading: "Catalogue",
    items: [
      { title: "Products", icon: Boxes, href: "/dashboard/products", roles: EVERYONE, types: ["CATALOG"] },
      { title: "Categories", icon: LayoutList, href: "/dashboard/categories", roles: ADMIN_STORE },
      { title: "Coupons", icon: Ticket, href: "/dashboard/coupons", roles: ADMIN_SALES, types: ["MARKETING"] },
      { title: "Store Banners", icon: MonitorPlay, href: "/dashboard/banners", roles: ADMIN },
    ],
  },
  {
    heading: "Inventory",
    items: [
      { title: "Stock Movements", icon: ArrowLeftRight, href: "/dashboard/stock-movements", roles: ADMIN_STORE, types: ["STOCK"] },
      { title: "Suppliers", icon: Truck, href: "/dashboard/suppliers", roles: ADMIN_STORE },
      { title: "Purchases", icon: ClipboardList, href: "/dashboard/purchases", roles: ADMIN_STORE, types: ["PURCHASE"] },
    ],
  },
  {
    heading: "Finance",
    items: [
      { title: "Expenses", icon: Wallet, href: "/dashboard/expenses", roles: ADMIN_CASH, types: ["EXPENSE"] },
      { title: "Reports", icon: BarChart3, href: "/dashboard/reports", roles: ADMIN },
    ],
  },
  {
    heading: "System",
    items: [
      { title: "Staff", icon: UserCog, href: "/dashboard/staff", roles: ADMIN, types: ["USER"] },
      { title: "Notifications", icon: Mail, href: "/dashboard/notifications", roles: EVERYONE, all: true },
      { title: "Audit Logs", icon: ScrollText, href: "/dashboard/audit-logs", roles: ADMIN },
      { title: "Settings", icon: Settings, href: "/dashboard/settings", roles: ADMIN, types: ["SYSTEM"] },
    ],
  },
];

function NavItem({ item, active, collapsed, count, latest, onClear }) {
  const Icon = item.icon;
  const tracked = !!(item.types || item.all);
  const unread = count > 0;
  const label = count > 99 ? "99+" : count;

  const iconTone = active
    ? ""
    : tracked
      ? unread
        ? "text-lime-600 dark:text-lime-400"
        : "text-slate-400 dark:text-slate-500"
      : "";

  return (
    <Link
      href={item.href}
      title={unread ? `${item.title} (${count} new)${latest ? `: ${latest.message}` : ""}` : item.title}
      aria-current={active ? "page" : undefined}
      className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
        collapsed ? "lg:justify-center lg:px-0" : ""
      } ${unread && !active ? "font-semibold" : "font-medium"} ${
        active
          ? "bg-lime-600 text-white shadow-sm"
          : unread
            ? "bg-lime-50/70 text-slate-800 hover:bg-lime-50 hover:text-lime-700 dark:bg-lime-500/10 dark:text-slate-100 dark:hover:bg-slate-700 dark:hover:text-lime-400"
            : "text-slate-600 hover:bg-lime-50 hover:text-lime-700 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-lime-400"
      }`}
    >
      <Icon className={`h-5 w-5 shrink-0 ${iconTone}`} />

      <span className={`min-w-0 flex-1 ${collapsed ? "lg:hidden" : ""}`}>
        <span className="block truncate">{item.title}</span>
        {/* newest message for this button, e.g. the Orders button shows the new order text */}
        {unread && latest && (
          <span
            className={`mt-0.5 flex items-center gap-1 text-[11px] font-normal ${
              active ? "text-white/90" : "text-slate-500 dark:text-slate-400"
            }`}
          >
            <Mail size={11} className="shrink-0" />
            <span className="truncate">{latest.message}</span>
          </span>
        )}
      </span>

      {/* number on every button that receives notifications: red when there are some, grey 0 when none */}
      {tracked && (
        <span className={`relative flex shrink-0 items-center ${collapsed ? "lg:absolute lg:right-1.5 lg:top-0.5" : ""}`}>
          <span
            className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
              unread
                ? "bg-red-600 text-white"
                : "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
            } ${collapsed ? "lg:h-4 lg:min-w-[16px] lg:px-1" : ""} ${unread && !collapsed ? "group-hover:hidden" : ""}`}
          >
            {label}
          </span>
          {/* hover the badge to clear this button back to 0 */}
          {unread && !collapsed && (
            <span
              role="button"
              tabIndex={0}
              title={`Clear ${item.title} notifications`}
              aria-label={`Clear ${item.title} notifications`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClear();
              }}
              className="hidden h-5 w-5 items-center justify-center rounded-full bg-slate-700/80 text-white hover:bg-red-600 group-hover:flex"
            >
              <X size={11} />
            </span>
          )}
        </span>
      )}
    </Link>
  );
}

export default function Sidebar({ collapsed, mobileOpen, onToggleCollapse, onCloseMobile }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;
  const { total, byType, latest, latestAny, markTypesRead } = useUnreadSummary({ enabled: !!session?.user });

  useEffect(() => {
    onCloseMobile();
  }, [pathname]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onCloseMobile();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCloseMobile]);

  const isActive = (item) =>
    item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`);

  const countFor = (item) =>
    item.all ? total : (item.types ?? []).reduce((sum, t) => sum + (byType[t] ?? 0), 0);

  const latestFor = (item) => {
    if (item.all) return latestAny;
    const list = (item.types ?? []).map((t) => latest[t]).filter(Boolean);
    if (list.length === 0) return null;
    return list.reduce((a, b) => (new Date(a.createdAt) >= new Date(b.createdAt) ? a : b));
  };

  // staying on a page for 2.5s counts as "seen": its badge clears (Notifications keeps the total)
  useEffect(() => {
    if (!role) return;
    const current = navSections
      .flatMap((s) => s.items)
      .find((item) => item.types && item.roles.includes(role) && isActive(item));
    if (!current || countFor(current) === 0) return;
    const timer = setTimeout(() => markTypesRead(current.types), 2500);
    return () => clearTimeout(timer);
  }, [pathname, byType, role]);

  const sections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => role && item.roles.includes(role)),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-all duration-300 dark:border-slate-700 dark:bg-slate-800 lg:translate-x-0 ${
          collapsed ? "lg:w-20" : "lg:w-64"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div
          className={`flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-700 ${
            collapsed ? "lg:justify-center lg:px-0" : ""
          }`}
        >
          <Link
            href="/dashboard"
            className="flex min-w-0 items-center gap-3"
            title="Green Planet Computers"
          >
            <Image
              src="/images/logo.jpeg"
              alt="Green Planet Computers"
              width={40}
              height={40}
              className="h-10 w-10 shrink-0 rounded-full object-cover"
            />
            <span
              className={`truncate text-sm font-bold leading-tight text-slate-800 dark:text-slate-50 ${
                collapsed ? "lg:hidden" : ""
              }`}
            >
              Green Planet
              <br />
              Computers
            </span>
          </Link>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close sidebar"
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-3 py-4">
          {sections.map((section, index) => (
            <div key={section.heading || index} className="space-y-1">
              {section.heading && (
                <>
                  <p
                    className={`px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-slate-400 ${
                      collapsed ? "lg:hidden" : ""
                    }`}
                  >
                    {section.heading}
                  </p>
                  {collapsed && (
                    <div className="mx-3 hidden border-t border-slate-200 dark:border-slate-700 lg:block" />
                  )}
                </>
              )}
              {section.items.map((item) => (
                <NavItem
                  key={item.href}
                  item={item}
                  active={isActive(item)}
                  collapsed={collapsed}
                  count={countFor(item)}
                  latest={latestFor(item)}
                  onClear={() => markTypesRead(item.all ? Object.keys(byType) : item.types)}
                />
              ))}
            </div>
          ))}
        </nav>

        <div className="shrink-0 space-y-1 border-t border-slate-200 p-3 dark:border-slate-700">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                title={session?.user?.name || "Account"}
                className={`flex w-full items-center gap-3 rounded-lg bg-slate-50 px-3 py-2 text-left transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-lime-600 dark:bg-slate-700/50 dark:hover:bg-slate-700 ${
                  collapsed ? "lg:justify-center lg:px-0" : ""
                }`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lime-600 text-sm font-bold text-white">
                  {session?.user?.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className={`min-w-0 flex-1 ${collapsed ? "lg:hidden" : ""}`}>
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-50">
                    {session?.user?.name || "My Account"}
                  </p>
                  <p className="truncate text-xs capitalize text-slate-500 dark:text-slate-400">
                    {role?.toLowerCase()}
                  </p>
                </div>
                <ChevronsUpDown
                  className={`h-4 w-4 shrink-0 text-slate-400 ${
                    collapsed ? "lg:hidden" : ""
                  }`}
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              align="start"
              sideOffset={8}
              className="w-56 px-2 py-2"
            >
              <DropdownMenuLabel>
                <p className="truncate text-sm font-semibold">
                  {session?.user?.name || "My Account"}
                </p>
                <p className="truncate text-xs font-normal text-slate-500">
                  {session?.user?.email}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/" className="flex cursor-pointer items-center">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  <span>Online Store</span>
                </Link>
              </DropdownMenuItem>
              {role === "ADMIN" && (
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings" className="flex cursor-pointer items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/admin/login" })}
                className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            type="button"
            onClick={onToggleCollapse}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`hidden w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 lg:flex ${
              collapsed ? "justify-center px-0" : ""
            }`}
          >
            {collapsed ? (
              <ChevronsRight className="h-5 w-5 shrink-0" />
            ) : (
              <>
                <ChevronsLeft className="h-5 w-5 shrink-0" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}