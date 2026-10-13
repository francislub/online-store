// src/components/frontend/SafeImage.jsx
"use client";

import React, { useState } from "react";
import { FALLBACK_IMAGE } from "@/data/homeData";

/**
 * <img> that never shows a broken icon: if the file is missing or fails to load,
 * it swaps to the placeholder image automatically.
 */
export default function SafeImage({ src, alt = "", className = "", ...props }) {
  const [failed, setFailed] = useState(false);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={failed ? FALLBACK_IMAGE : src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={className}
      {...props}
    />
  );
}