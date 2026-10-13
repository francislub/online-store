// src/components/frontend/AccountMenu.jsx
// Route: n/a. Replaces the plain Account icon in SiteHeader.
"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, LogOut, Package, User, UserPlus, MapPin } from "lucide-react";
import { useCustomer } from "@/context/CustomerContext";

const item = "flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-700";

export default function AccountMenu() {
  const router = useRouter();
  const { customer, loading, logout } = useCustomer();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const out = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", out);
    return () => document.removeEventListener("mousedown", out);
  }, []);

  const close = () => setOpen(false);
  const onLogout = async () => {
    close();
    await logout();
    router.push("/");
    router.refresh();
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Account"
        aria-expanded={open}
        className="flex h-10 items-center gap-2 rounded-full bg-white px-2.5 text-gray-900 transition hover:bg-gray-100"
      >
        {customer ? (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
            {customer.name.charAt(0).toUpperCase()}
          </span>
        ) : (
          <User size={18} />
        )}
        {customer && <span className="hidden max-w-[90px] truncate text-[13px] font-semibold xl:inline">{customer.name.split(" ")[0]}</span>}
      </button>

      {open && !loading && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 text-gray-800 shadow-xl">
          {customer ? (
            <>
              <div className="border-b border-gray-100 px-4 py-3">
                <p className="truncate text-sm font-semibold text-gray-900">{customer.name}</p>
                <p className="truncate text-xs text-gray-500">{customer.email || customer.phone}</p>
              </div>
              <Link href="/account" onClick={close} className={item}><User size={15} /> My account</Link>
              <Link href="/account?tab=orders" onClick={close} className={item}><Package size={15} /> My orders</Link>
              <Link href="/account?tab=addresses" onClick={close} className={item}><MapPin size={15} /> Addresses</Link>
              <button onClick={onLogout} className={`${item} w-full border-t border-gray-100`}><LogOut size={15} /> Logout</button>
            </>
          ) : (
            <>
              <Link href="/account" onClick={close} className={item}><LogIn size={15} /> Login</Link>
              <Link href="/account?tab=register" onClick={close} className={item}><UserPlus size={15} /> Create account</Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}