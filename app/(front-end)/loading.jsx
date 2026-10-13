"use client";
// src/components/frontend/RouteLoader.jsx
// Shows the Green Planet loader (a) on first page load and (b) on every
// internal link navigation, until the new route has rendered.
// Does NOT depend on Next's loading.jsx / Suspense, so it always appears.

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import GreenPlanetLoader from "@/components/frontend/GreenPlanetLoader";

const MIN_SHOW_MS = 700; // keep it visible long enough to be seen
const FADE_MS = 300;
const SAFETY_MS = 15000; // never get stuck

function Inner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams?.toString() ?? ""}`;

  const [mounted, setMounted] = useState(true); // true => splash on first load
  const [fading, setFading] = useState(false);
  const shownAt = useRef(Date.now());
  const timers = useRef([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const show = () => {
    clearTimers();
    shownAt.current = Date.now();
    setFading(false);
    setMounted(true);
    timers.current.push(setTimeout(hide, SAFETY_MS));
  };

  const hide = () => {
    clearTimers();
    const wait = Math.max(0, MIN_SHOW_MS - (Date.now() - shownAt.current));
    timers.current.push(
      setTimeout(() => {
        setFading(true);
        timers.current.push(setTimeout(() => setMounted(false), FADE_MS));
      }, wait)
    );
  };

  // Route finished changing (also runs on first mount) -> hide
  useEffect(() => {
    hide();
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeKey]);

  // Internal link clicked -> show
  useEffect(() => {
    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest?.("a[href]");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      let url;
      try {
        url = new URL(a.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      const sameRoute =
        url.pathname === window.location.pathname &&
        url.search === window.location.search;
      if (sameRoute) return; // same page or hash-only change
      show();
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!mounted) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#fff",
        opacity: fading ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease`,
        pointerEvents: fading ? "none" : "auto",
      }}
    >
      <GreenPlanetLoader fullScreen />
    </div>
  );
}

export default function RouteLoader() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}