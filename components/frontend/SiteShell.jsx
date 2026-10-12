// src/components/frontend/SiteShell.jsx
"use client";

import React, { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import SideRail from "./SideRail";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import CartDrawer from "./CartDrawer";
import { CartProvider, useCart } from "@/context/CartContext";

function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > 500);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className={`fixed bottom-6 right-6 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-lg transition-all hover:bg-gray-50 ${
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <ArrowUp size={18} />
    </button>
  );
}

function ShellInner({ children }) {
  const [railOpen, setRailOpen] = useState(false);
  const { count, subtotal, setOpen: setCartOpen } = useCart();

  // cart count comes from the cart store; wishlist / compare stay as TODO
  const counts = { cart: count, wishlist: 0, compare: 0, total: subtotal };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <SideRail open={railOpen} setOpen={setRailOpen} />
      <div className="lg:pl-14">
        <SiteHeader
          onOpenCategories={() => setRailOpen(true)}
          onOpenCart={() => setCartOpen(true)}
          counts={counts}
        />
        <main>{children}</main>
        <SiteFooter />
      </div>
      <BackToTop />
      <CartDrawer />
    </div>
  );
}

export default function SiteShell({ children }) {
  return (
    <CartProvider>
      <ShellInner>{children}</ShellInner>
    </CartProvider>
  );
}
