// app/dashboard/layout.jsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import Sidebar from "@/components/backoffice/Sidebar";
import Navbar from "@/components/backoffice/Navbar";
import Providers from "@/components/Providers";

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("gpc-sidebar-collapsed") === "true") {
      setCollapsed(true);
    }
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("gpc-sidebar-collapsed", String(next));
      return next;
    });
  }, []);

  const openMobile = useCallback(() => setMobileOpen(true), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <Providers>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <Sidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onToggleCollapse={toggleCollapsed}
          onCloseMobile={closeMobile}
        />

        <div
          className={`transition-all duration-300 ${
            collapsed ? "lg:pl-20" : "lg:pl-64"
          }`}
        >
          <Navbar
            collapsed={collapsed}
            onToggleCollapse={toggleCollapsed}
            onOpenMobile={openMobile}
          />

          <main className="mt-16 min-h-screen p-4 text-slate-800 dark:text-slate-50 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </Providers>
  );
}