// src/lib/useSessionUser.js
// Route: n/a (client hook: who is signed in?)
"use client";

import { useEffect, useState } from "react";

export function useSessionUser() {
  const [state, setState] = useState({ loading: true, user: null });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => !cancelled && setState({ loading: false, user: j?.user || null }))
      .catch(() => !cancelled && setState({ loading: false, user: null }));
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

// only allow same-site redirects
export function safeCallback(url, fallback = "/") {
  return typeof url === "string" && url.startsWith("/") && !url.startsWith("//") ? url : fallback;
}