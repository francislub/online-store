// src/context/CartContext.jsx
// Route: n/a (global cart provider, persisted in the browser)
"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "nx_cart_v1";

export const FREE_SHIPPING_THRESHOLD = 20000; // UGX

export const formatUGX = (n) => `UGX ${Number(n || 0).toLocaleString("en-US")}`;

// stock = null means "unknown", so no cap is applied
const cap = (qty, stock) => (stock ? Math.min(qty, stock) : qty);

const isValidItem = (i) =>
  i && typeof i.id === "string" && Number.isFinite(i.price) && Number.isInteger(i.qty) && i.qty > 0;

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);

  // load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed.filter(isValidItem));
      }
    } catch {}
    setReady(true);
  }, []);

  // persist
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items, ready]);

  // lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const addItem = useCallback((product, qty = 1) => {
    const stock = Number(product.stock) > 0 ? Number(product.stock) : null;

    setItems((prev) => {
      const found = prev.find((i) => i.id === product.id);
      if (found) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, stock, qty: cap(i.qty + qty, stock) } : i
        );
      }
      return [
        ...prev,
        {
          id: product.id, // Product.id from the database
          name: product.name,
          price: product.price,
          image: product.image,
          href: product.href || null,
          sku: product.sku || "N/A",
          stock,
          qty: cap(qty, stock),
        },
      ];
    });
    setOpen(true); // show the cart panel right after "Add To Cart"
  }, []);

  const updateQty = useCallback((id, qty) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, qty: cap(Math.max(1, qty), i.stock) } : i))
    );
  }, []);

  const removeItem = useCallback((id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(() => {
    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    const count = items.reduce((s, i) => s + i.qty, 0);
    return { items, open, setOpen, addItem, updateQty, removeItem, clear, subtotal, count };
  }, [items, open, addItem, updateQty, removeItem, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}