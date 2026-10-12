// components/backoffice/CategoryIcon.jsx
// Route: n/a (icon + colour for each notification category)
import React from "react";
import {
  Bell,
  Boxes,
  CreditCard,
  FileSignature,
  FileText,
  Megaphone,
  Package,
  Settings,
  ShoppingCart,
  Truck,
  Undo2,
  Users,
  Wallet,
} from "lucide-react";

const MAP = {
  ORDER: { icon: ShoppingCart, color: "bg-blue-100 text-blue-700" },
  PAYMENT: { icon: CreditCard, color: "bg-green-100 text-green-700" },
  INVOICE: { icon: FileText, color: "bg-amber-100 text-amber-700" },
  QUOTE: { icon: FileSignature, color: "bg-indigo-100 text-indigo-700" },
  RETURN: { icon: Undo2, color: "bg-rose-100 text-rose-700" },
  PURCHASE: { icon: Truck, color: "bg-cyan-100 text-cyan-700" },
  STOCK: { icon: Boxes, color: "bg-orange-100 text-orange-700" },
  EXPENSE: { icon: Wallet, color: "bg-red-100 text-red-700" },
  CATALOG: { icon: Package, color: "bg-lime-100 text-lime-700" },
  MARKETING: { icon: Megaphone, color: "bg-pink-100 text-pink-700" },
  USER: { icon: Users, color: "bg-violet-100 text-violet-700" },
  SYSTEM: { icon: Settings, color: "bg-slate-200 text-slate-700" },
};

export default function CategoryIcon({ type, className = "h-9 w-9" }) {
  const { icon: Icon, color } = MAP[type] ?? { icon: Bell, color: "bg-slate-100 text-slate-600" };
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full ${color} ${className}`}>
      <Icon className="h-4 w-4" />
    </span>
  );
}