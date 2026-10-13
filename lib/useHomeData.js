// src/lib/useHomeData.js
// Route: n/a (client hook; fetches /api/storefront/home once and shares it)
"use client";

import { useEffect, useState } from "react";

let cache = null;
let inflight = null;

function load() {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = fetch("/api/storefront/home", { cache: "no-store" })
      .then(async (res) => {
        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error(json?.message || "Failed to load home data");
        cache = json.data;
        return cache;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export function useHomeData() {
  const [data, setData] = useState(cache);
  const [loading, setLoading] = useState(!cache);
  const [error, setError] = useState("");

  useEffect(() => {
    if (cache) return;
    let cancelled = false;
    load()
      .then((d) => !cancelled && setData(d))
      .catch((err) => {
        console.log("[useHomeData]", err);
        if (!cancelled) setError(err.message);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}