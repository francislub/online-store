
"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import BannerForm from "@/components/backoffice/BannerForm";

export default function UpdateBanner() {
  const { id } = useParams();
  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/banners/${id}`, { cache: "no-store" });
        const json = await res.json().catch(() => null);
        console.log("[UpdateBanner] loaded", res.status, json);
        if (cancelled) return;

        if (!res.ok) {
          setErrorMessage(json?.message || "Failed to load banner");
        } else {
          setBanner(json.data);
        }
      } catch (err) {
        console.log(err);
        if (!cancelled) setErrorMessage("Network error, please try again");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading banner...
      </div>
    );
  }

  if (errorMessage || !banner) {
    return (
      <div className="py-20 text-center">
        <p className="mb-4 text-slate-600 dark:text-slate-300">{errorMessage || "Banner not found"}</p>
        <Link href="/dashboard/banners" className="text-lime-700 underline">
          Back to banners
        </Link>
      </div>
    );
  }

  // key forces the form to mount with the loaded values
  return <BannerForm key={banner.id} mode="edit" initialData={banner} />;
}