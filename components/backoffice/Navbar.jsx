// components/backoffice/Navbar.jsx
"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import {
  Bell,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ThemeSwitcherBtn from "@/components/ThemeSwitcherBtn";

export default function Navbar({ collapsed, onToggleCollapse, onOpenMobile }) {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <header
      className={`fixed right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 transition-all duration-300 dark:border-slate-700 dark:bg-slate-800 sm:px-6 left-0 ${
        collapsed ? "lg:left-20" : "lg:left-64"
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobile}
          aria-label="Open sidebar"
          className="rounded-md p-2 text-lime-700 hover:bg-lime-50 dark:text-lime-500 dark:hover:bg-slate-700 lg:hidden"
        >
          <Menu className="h-6 w-6" />
        </button>

        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden rounded-md p-2 text-lime-700 hover:bg-lime-50 dark:text-lime-500 dark:hover:bg-slate-700 lg:inline-flex"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-6 w-6" />
          ) : (
            <PanelLeftClose className="h-6 w-6" />
          )}
        </button>

        <Link
          href="/dashboard"
          className="truncate text-base font-semibold text-slate-800 dark:text-slate-50 lg:hidden"
        >
          Green Planet Computers
        </Link>
      </div>

      <div className="flex items-center gap-2 text-green-600 sm:gap-3">
        <ThemeSwitcherBtn />

        <Link
          href="/dashboard/notifications"
          aria-label="Notifications"
          className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          <Bell className="h-5 w-5 text-green-600" />
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-lime-600"
            >
              {user?.image ? (
                <img
                  src={user.image}
                  alt={user.name || "User"}
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-lime-600 text-sm font-bold text-white">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[12rem] px-2 py-2">
            <DropdownMenuLabel>
              <p className="truncate text-sm font-semibold">{user?.name || "My Account"}</p>
              <p className="truncate text-xs font-normal text-slate-500">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard" className="flex cursor-pointer items-center">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                <span>Dashboard</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings" className="flex cursor-pointer items-center">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
              className="cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}