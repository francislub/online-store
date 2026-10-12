// components/backoffice/SmallCards.jsx
import React from "react";
import SmallCard from "./SmallCard";

export default function SmallCards({ items = [], className = "grid-cols-2 md:grid-cols-3 xl:grid-cols-6" }) {
  if (items.length === 0) return null;
  return (
    <div className={`grid gap-4 py-3 ${className}`}>
      {items.map((item) => (
        <SmallCard status={item} key={item.title} />
      ))}
    </div>
  );
}