// src/hooks/useNotifications.js
// Polls the notifications API every 5s and announces NEW items with:
//   pop-up toast + optional sound + optional desktop alert (when the tab is hidden) + "(3)" in the tab title.
// Also listens for instant local events from clientNotify() and for "app:notify-refresh".
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const POLL_MS = 5000;
const LOCAL_DEDUPE_MS = 60000;
const RECENT_MS = 120000; // on first load, still pop up unread items created in the last 2 minutes
const SOUND_KEY = "notify:sound";

function beep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.value = 0.06;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.frequency.setValueAtTime(1175, ctx.currentTime + 0.12);
    osc.stop(ctx.currentTime + 0.25);
    setTimeout(() => ctx.close(), 400);
  } catch (error) {
    // browsers block audio until the user has clicked once, that is fine
  }
}

export default function useNotifications({
  endpoint = "/api/notifications",
  enabled = true,
  titleBadge = true,
} = {}) {
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [soundEnabled, setSoundEnabledState] = useState(true);

  const soundRef = useRef(true);
  const seen = useRef(new Set());
  const primed = useRef(false);
  const recentLocal = useRef(new Map());

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SOUND_KEY);
      if (saved !== null) {
        soundRef.current = saved === "1";
        setSoundEnabledState(saved === "1");
      }
    } catch (error) {}
  }, []);

  const setSoundEnabled = useCallback((on) => {
    soundRef.current = on;
    setSoundEnabledState(on);
    try {
      localStorage.setItem(SOUND_KEY, on ? "1" : "0");
    } catch (error) {}
    if (on) beep();
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const announce = useCallback((toast) => {
    const id = toast.id ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [{ ...toast, id }, ...prev].slice(0, 4));
    if (soundRef.current) beep();
    try {
      if (typeof Notification !== "undefined" && Notification.permission === "granted" && document.hidden) {
        new Notification(toast.title, { body: toast.message });
      }
    } catch (error) {}
  }, []);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await fetch(`${endpoint}?limit=10`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const list = data.items ?? [];
      setItems(list);
      setUnreadCount(data.unreadCount ?? 0);

      const skipLocal = (n) => {
        const at = recentLocal.current.get(n.message);
        return at && Date.now() - at < LOCAL_DEDUPE_MS;
      };

      if (!primed.current) {
        primed.current = true;
        const recent = list
          .filter((n) => !n.readAt && Date.now() - new Date(n.createdAt).getTime() < RECENT_MS)
          .slice(0, 3)
          .reverse();
        list.forEach((n) => seen.current.add(n.id));
        recent.forEach((n) => announce({ title: n.title, message: n.message, type: n.type }));
        return;
      }

      const fresh = list.filter((n) => !seen.current.has(n.id) && !n.readAt).reverse();
      fresh.forEach((n) => {
        seen.current.add(n.id);
        if (skipLocal(n)) return;
        announce({ title: n.title, message: n.message, type: n.type });
      });
      list.forEach((n) => seen.current.add(n.id));
    } catch (error) {
      // network hiccup, next tick will retry
    }
  }, [enabled, endpoint, announce]);

  useEffect(() => {
    if (!enabled) {
      primed.current = false;
      seen.current = new Set();
      setItems([]);
      setUnreadCount(0);
      return;
    }
    refresh();
    const timer = setInterval(() => {
      if (!document.hidden) refresh();
    }, POLL_MS);
    const onVisible = () => !document.hidden && refresh();
    const onRefresh = () => refresh();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("app:notify-refresh", onRefresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("app:notify-refresh", onRefresh);
    };
  }, [enabled, refresh]);

  // instant pop-ups raised by the browser itself (works for guests too)
  useEffect(() => {
    const onLocal = (e) => {
      const d = e.detail ?? {};
      if (!d.message) return;
      recentLocal.current.set(d.message, Date.now());
      announce({ title: d.title ?? "Activity", message: d.message, type: d.type });
    };
    window.addEventListener("app:notify", onLocal);
    return () => window.removeEventListener("app:notify", onLocal);
  }, [announce]);

  // "(3) Dashboard" in the browser tab
  useEffect(() => {
    if (!enabled || !titleBadge) return;
    const base = document.title.replace(/^\(\d+\)\s*/, "");
    document.title = unreadCount > 0 ? `(${unreadCount}) ${base}` : base;
  }, [unreadCount, enabled, titleBadge]);

  const markRead = useCallback(
    async (payload) => {
      try {
        await fetch(endpoint, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (error) {}
      window.dispatchEvent(new Event("app:notify-refresh")); // bell + sidebar reload
    },
    [endpoint]
  );

  // empties the inbox: marks everything read, then deletes the read ones, so the count becomes 0
  const clearAll = useCallback(async () => {
    const headers = { "Content-Type": "application/json" };
    try {
      await fetch(endpoint, { method: "PUT", headers, body: JSON.stringify({ all: true }) });
      await fetch(endpoint, { method: "DELETE", headers, body: JSON.stringify({ allRead: true }) });
    } catch (error) {}
    setItems([]);
    setUnreadCount(0);
    setToasts([]);
    window.dispatchEvent(new Event("app:notify-refresh")); // sidebar badges reset too
  }, [endpoint]);

  // creates a real notification for yourself so you can verify the whole pipeline
  const sendTest = useCallback(async (type = "ORDER") => {
    try {
      await fetch("/api/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
    } catch (error) {}
    window.dispatchEvent(new Event("app:notify-refresh"));
  }, []);

  return {
    items,
    unreadCount,
    toasts,
    dismissToast,
    markRead,
    refresh,
    clearAll,
    sendTest,
    soundEnabled,
    setSoundEnabled,
  };
}