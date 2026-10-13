// src/context/CustomerContext.jsx
// Route: n/a. Wrap the storefront layout with <CustomerProvider>.
"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/storefrontApi";

const Ctx = createContext(null);

export function CustomerProvider({ children }) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const res = await api("/api/storefront/auth/me");
    setCustomer(res.ok ? res.data : null);
    setLoading(false);
    return res.ok ? res.data : null;
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email, password) => {
    const res = await api("/api/storefront/auth/login", { method: "POST", body: { email, password } });
    if (res.ok) setCustomer(res.data);
    return res;
  }, []);

  const register = useCallback(async (payload) => {
    const res = await api("/api/storefront/auth/register", { method: "POST", body: payload });
    if (res.ok) setCustomer(res.data);
    return res;
  }, []);

  const logout = useCallback(async () => {
    await api("/api/storefront/auth/logout", { method: "POST" });
    setCustomer(null);
  }, []);

  const value = useMemo(
    () => ({ customer, loading, login, register, logout, refresh }),
    [customer, loading, login, register, logout, refresh]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCustomer() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCustomer must be used inside <CustomerProvider>");
  return ctx;
}