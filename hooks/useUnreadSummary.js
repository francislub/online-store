// src/hooks/useUnreadSummary.js
// Unread totals per category, used by the sidebar badges.
// Refreshes every 10s and instantly when the bell marks something read / a new item arrives.
"use client";

import { useCallback, useEffect, useState } from "react";

export default function useUnreadSummary({ enabled = true } = {}) {
  const [summary, setSummary] = useState({ total: 0, byType: {} });

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/summary", { cache: "no-store" });
      if (!res.ok) return;
      const d = await res.json();
      setSummary({ total: d.total ?? 0, byType: d.byType ?? {} });
    } catch (error) {
      // try again on next tick
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    refresh();
    const timer = setInterval(() => {
      if (!document.hidden) refresh();
    }, 10000);
    const onVisible = () => !document.hidden && refresh();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("app:notify-refresh", refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("app:notify-refresh", refresh);
    };
  }, [enabled, refresh]);

  // visiting a page clears its badge
  const markTypesRead = useCallback(async (types) => {
    setSummary((prev) => {
      const byType = { ...prev.byType };
      let total = prev.total;
      types.forEach((t) => {
        total -= byType[t] ?? 0;
        delete byType[t];
      });
      return { total: Math.max(0, total), byType };
    });
    try {
      await fetch("/api/notifications/summary", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ types }),
      });
    } catch (error) {
      // ignore
    }
    window.dispatchEvent(new Event("app:notify-refresh"));
  }, []);

  return { total: summary.total, byType: summary.byType, markTypesRead, refresh };
}