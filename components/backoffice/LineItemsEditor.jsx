// components/backoffice/LineItemsEditor.jsx
// Route: n/a (product lines editor shared by OrderForm and QuoteForm)
"use client";

import React from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import LookupSelect from "@/components/backoffice/LookupSelect";
import { inputClass } from "@/components/backoffice/FormField";
import { money } from "@/lib/format";

// item shape: { productId, name, sku, stock?, costPrice?, quantity, unitPrice }
export default function LineItemsEditor({ items, onChange, checkStock = false }) {
  function addProduct(product) {
    const existing = items.find((i) => i.productId === product.id);
    if (existing) {
      onChange(items.map((i) => (i.productId === product.id ? { ...i, quantity: Number(i.quantity) + 1 } : i)));
      return;
    }
    onChange([
      ...items,
      {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        stock: product.stock,
        costPrice: product.costPrice,
        quantity: 1,
        unitPrice: product.salePrice ?? product.price,
      },
    ]);
  }

  const patch = (productId, changes) =>
    onChange(items.map((i) => (i.productId === productId ? { ...i, ...changes } : i)));
  const remove = (productId) => onChange(items.filter((i) => i.productId !== productId));

  return (
    <div>
      <LookupSelect
        type="products"
        placeholder="Search product by name, SKU, barcode or brand"
        onSelect={addProduct}
        renderOption={(p) => (
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-medium">{p.name}</div>
              <div className="text-xs text-gray-500">{[p.brand, p.model, p.sku].filter(Boolean).join(" • ")}</div>
            </div>
            <div className="text-right text-xs">
              <div className="font-semibold">{money(p.salePrice ?? p.price)}</div>
              <div className={p.stock <= 0 ? "text-red-600" : "text-gray-500"}>{p.stock} in stock</div>
            </div>
          </div>
        )}
      />

      <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
          <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="w-24 px-4 py-3">Qty</th>
              <th className="w-36 px-4 py-3">Unit price</th>
              <th className="w-36 px-4 py-3 text-right">Total</th>
              <th className="w-12 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center">Search above to add products</td>
              </tr>
            ) : (
              items.map((item) => {
                const qty = Number(item.quantity) || 0;
                const price = Number(item.unitPrice) || 0;
                const overStock = checkStock && item.stock !== undefined && qty > item.stock;
                const belowCost = item.costPrice > 0 && price < item.costPrice;
                return (
                  <tr key={item.productId} className="border-t bg-white dark:border-gray-700 dark:bg-gray-800">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
                      <div className="text-xs">{item.sku}</div>
                      {overStock && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-red-600">
                          <AlertTriangle className="h-3 w-3" /> Only {item.stock} in stock
                        </div>
                      )}
                      {belowCost && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-amber-600">
                          <AlertTriangle className="h-3 w-3" /> Price is below cost ({money(item.costPrice)})
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => patch(item.productId, { quantity: e.target.value })}
                        className={inputClass}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={0}
                        value={item.unitPrice}
                        onChange={(e) => patch(item.productId, { unitPrice: e.target.value })}
                        className={inputClass}
                      />
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">{money(qty * price)}</td>
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => remove(item.productId)} className="text-red-600 hover:text-red-800" aria-label="Remove item">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
