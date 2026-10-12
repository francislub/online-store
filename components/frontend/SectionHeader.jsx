// src/components/frontend/SectionHeader.jsx
import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function SectionHeader({ title, href = "#", cta = "More Products" }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      <Link
        href={href}
        className="flex items-center gap-1 rounded-full bg-blue-100 px-5 py-2.5 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-200"
      >
        {cta} <ChevronRight size={16} />
      </Link>
    </div>
  );
}
