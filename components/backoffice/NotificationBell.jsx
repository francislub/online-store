// components/backoffice/NotificationBell.jsx
// Route: n/a (header bell with live unread count, links to /dashboard/notifications)
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { makeGetRequest } from "@/lib/apiRequest";

export default function NotificationBell() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      const data = await makeGetRequest("/api/notifications?countOnly=1");
      if (active && data) setCount(data.unreadCount ?? 0);
    }
    load();
    const timer = setInterval(load, 30000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <Link
      href="/dashboard/notifications"
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
      aria-label="Notifications"
    >
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 min-w-[18px] rounded-full bg-red-600 px-1 text-center text-[10px] font-bold leading-[18px] text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}