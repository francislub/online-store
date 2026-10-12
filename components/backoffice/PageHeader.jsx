// components/backoffice/PageHeader.jsx
// Route: n/a (shared component, used on /dashboard/* list pages)
import { Plus } from "lucide-react";
import Link from "next/link";
import React from "react";
import Heading from "./Heading";

export default function PageHeader({ heading, linkTitle, href }) {
  return (
    <div className="mb-4 flex justify-between border-b border-slate-500 py-4">
      <Heading title={heading} />
      {href && (
        <Link
          className="me-2 inline-flex items-center space-x-3 rounded-lg bg-lime-600 px-5 py-3 text-center text-base font-medium text-white hover:bg-lime-600/90 focus:outline-none focus:ring-4 focus:ring-lime-600/50 dark:focus:ring-lime-600/55"
          href={href}
        >
          <Plus />
          <span>{linkTitle}</span>
        </Link>
      )}
    </div>
  );
}