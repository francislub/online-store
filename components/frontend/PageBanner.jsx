// src/components/frontend/PageBanner.jsx
import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

// Shared title + breadcrumb banner used by the inner pages.
export default function PageBanner({ title, subtitle }) {
  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
        <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-1 text-sm text-gray-500">
          <Link href="/" className="hover:text-blue-600">
            Home
          </Link>
          <ChevronRight size={14} />
          <span className="text-gray-800">{title}</span>
        </nav>
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-gray-500">{subtitle}</p>}
      </div>
    </div>
  );
}
