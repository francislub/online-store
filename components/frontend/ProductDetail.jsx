// src/components/frontend/ProductDetail.jsx
// Route: /product/:id (gallery, price, stock, quantity, add to cart, specs)
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, Minus, Plus, ShieldCheck } from "lucide-react";
import { Stars } from "./ProductCard";
import { useCart, formatUGX } from "@/context/CartContext";

const PLACEHOLDER = "/images/placeholder.png";

export default function ProductDetail({ product }) {
  const router = useRouter();
  const { addItem, setOpen } = useCart();

  const imageList = product.images ?? [];
  const badges = product.badges ?? [];
  const tags = product.tags ?? [];
  const specs = product.specs ?? [];
  const breadcrumb = product.breadcrumb ?? [];

  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState(product.description ? "description" : "specs");

  const images = imageList.length ? imageList : [PLACEHOLDER];
  const max = product.stock > 0 ? product.stock : 1;
  const save = product.oldPrice ? product.oldPrice - product.price : 0;

  // Cart links point to /product/<id>.
  const cartProduct = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    image: product.image || imageList[0] || PLACEHOLDER,
    href: `/product/${product.id}`,
    sku: product.sku,
    stock: product.stock,
  };

  const buyNow = () => {
    addItem(cartProduct, qty);
    setOpen(false);
    router.push("/checkout");
  };

  const info = [
    ["SKU", product.sku],
    ["Brand", product.brand],
    ["Model", product.model],
    ["Warranty", product.warrantyMonths ? `${product.warrantyMonths} month${product.warrantyMonths === 1 ? "" : "s"}` : ""],
  ].filter(([, v]) => v);

  return (
    <section className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      {/* breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1 text-sm text-gray-500">
        <Link href="/" className="hover:text-blue-600">Home</Link>
        <ChevronRight size={14} />
        {breadcrumb.map((b) => (
          <React.Fragment key={b.slug}>
            <Link href={`/category/${b.slug}`} className="hover:text-blue-600">{b.name}</Link>
            <ChevronRight size={14} />
          </React.Fragment>
        ))}
        <span className="line-clamp-1 font-medium text-gray-800">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* gallery */}
        <div>
          <div className="relative flex h-[320px] items-center justify-center overflow-hidden rounded-xl bg-white p-4 shadow-sm sm:h-[460px]">
            {badges.length > 0 && (
              <div className="absolute left-3 top-3 z-10 flex flex-col gap-1">
                {badges.map((b, i) => (
                  <span key={`${b.label}-${i}`} className={`rounded-full px-2.5 py-1 text-[11px] font-bold text-white ${b.color}`}>
                    {b.label}
                  </span>
                ))}
              </div>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[active] || PLACEHOLDER}
              alt={product.name}
              onError={(e) => {
                if (!e.currentTarget.src.endsWith(PLACEHOLDER)) e.currentTarget.src = PLACEHOLDER;
              }}
              className="max-h-full max-w-full object-contain"
            />
          </div>

          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {images.map((src, i) => (
                <button
                  key={`${src}-${i}`}
                  onClick={() => setActive(i)}
                  aria-label={`Show image ${i + 1}`}
                  className={`h-20 w-20 shrink-0 overflow-hidden rounded-lg border bg-white p-1.5 ${
                    i === active ? "border-blue-600" : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* details */}
        <div>
          {product.brand && <p className="text-sm font-medium uppercase tracking-wide text-gray-400">{product.brand}</p>}
          <h1 className="mt-1 text-2xl font-bold leading-snug text-gray-900">{product.name}</h1>
          <div className="mt-2"><Stars size={14} /></div>

          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-bold text-blue-600">{formatUGX(product.price)}</span>
            {product.oldPrice && (
              <>
                <span className="text-lg text-gray-400 line-through">{formatUGX(product.oldPrice)}</span>
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-sm font-semibold text-blue-700">
                  Save {formatUGX(save)}
                </span>
              </>
            )}
          </div>

          <p className="mt-3 text-sm font-medium">
            {product.inStock ? (
              <span className="flex items-center gap-1.5 text-gray-800">
                <Check size={16} className="text-blue-600" /> In stock
                {product.stock <= 5 && <span className="text-amber-600">· only {product.stock} left</span>}
              </span>
            ) : (
              <span className="text-red-700">Out of stock</span>
            )}
          </p>

          {product.inStock ? (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center overflow-hidden rounded-md border border-gray-300">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                  aria-label="Decrease quantity"
                  className="flex h-11 w-11 items-center justify-center hover:bg-gray-50 disabled:opacity-40"
                >
                  <Minus size={15} />
                </button>
                <span className="flex h-11 w-12 items-center justify-center text-sm font-semibold">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(max, q + 1))}
                  disabled={qty >= max}
                  aria-label="Increase quantity"
                  className="flex h-11 w-11 items-center justify-center hover:bg-gray-50 disabled:opacity-40"
                >
                  <Plus size={15} />
                </button>
              </div>

              <button
                onClick={() => addItem(cartProduct, qty)}
                className="h-11 flex-1 rounded-md bg-blue-600 px-6 text-sm font-semibold text-white hover:bg-blue-700 sm:flex-none"
              >
                Add To Cart
              </button>
              <button
                onClick={buyNow}
                className="h-11 flex-1 rounded-md bg-blue-100 px-6 text-sm font-semibold text-blue-700 hover:bg-blue-200 sm:flex-none"
              >
                Buy Now
              </button>
            </div>
          ) : (
            <Link
              href="/contact"
              className="mt-5 inline-block rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Ask about availability
            </Link>
          )}

          {product.warrantyMonths > 0 && (
            <p className="mt-4 flex items-center gap-2 text-sm text-gray-600">
              <ShieldCheck size={18} className="text-green-600" />
              {product.warrantyMonths} month warranty · genuine product
            </p>
          )}

          <dl className="mt-5 divide-y divide-gray-100 rounded-xl bg-white text-sm shadow-sm">
            {info.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 px-4 py-2.5">
                <dt className="text-gray-500">{k}</dt>
                <dd className="text-right font-medium text-gray-800">{v}</dd>
              </div>
            ))}
            {product.category && (
              <div className="flex justify-between gap-4 px-4 py-2.5">
                <dt className="text-gray-500">Category</dt>
                <dd>
                  <Link href={`/category/${product.category.slug}`} className="font-medium text-blue-600 hover:underline">
                    {product.category.name}
                  </Link>
                </dd>
              </div>
            )}
          </dl>

          {tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((t) => (
                <Link
                  key={t}
                  href={`/products?q=${encodeURIComponent(t)}`}
                  className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 hover:bg-gray-200"
                >
                  {t}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* description / specs */}
      {(product.description || specs.length > 0) && (
        <div className="mt-10 rounded-xl bg-white p-5 shadow-sm sm:p-6">
          <div className="flex gap-6 border-b border-gray-200">
            {product.description && (
              <button
                onClick={() => setTab("description")}
                className={`-mb-px border-b-2 pb-3 text-sm font-semibold ${
                  tab === "description" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"
                }`}
              >
                Description
              </button>
            )}
            {specs.length > 0 && (
              <button
                onClick={() => setTab("specs")}
                className={`-mb-px border-b-2 pb-3 text-sm font-semibold ${
                  tab === "specs" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"
                }`}
              >
                Specifications
              </button>
            )}
          </div>

          {tab === "description" && product.description && (
            <p className="mt-5 whitespace-pre-line text-[15px] leading-relaxed text-gray-700">{product.description}</p>
          )}
          {tab === "specs" && specs.length > 0 && (
            <table className="mt-5 w-full text-sm">
              <tbody>
                {specs.map((s) => (
                  <tr key={s.label} className="border-b border-gray-100 last:border-0">
                    <th className="w-1/3 py-2.5 pr-4 text-left font-medium text-gray-500">{s.label}</th>
                    <td className="py-2.5 text-gray-800">{s.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </section>
  );
}