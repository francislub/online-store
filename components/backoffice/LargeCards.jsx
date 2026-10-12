// components/backoffice/LargeCards.jsx
import React from "react";
import LargeCard from "./LargeCard";

export default function LargeCards({ items = [] }) {
  return (
    <div className="grid grid-cols-1 gap-4 py-6 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <LargeCard data={item} key={item.period} />
      ))}
    </div>
  );
}