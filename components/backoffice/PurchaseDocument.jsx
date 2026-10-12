// components/backoffice/PurchaseDocument.jsx
// Route: n/a (A4 purchase order sheet, shown on /dashboard/purchases/[id] and printed to PDF)
"use client";

import React from "react";

// Update these with the real shop details
const COMPANY = {
  name: "Green Planet Computers",
  tagline: "Computers, accessories & IT solutions",
  address: "Kampala, Uganda",
  phone: "+256 700 000 000",
  email: "info@greenplanetcomputers.com",
  logo: "/images/logo.jpeg",
};

const money = (value) => `UGX ${Number(value ?? 0).toLocaleString()}`;
const fmtDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-";

const STATUS_COLORS = {
  DRAFT: { bg: "#f3f4f6", fg: "#374151" },
  ORDERED: { bg: "#dbeafe", fg: "#1e40af" },
  RECEIVED: { bg: "#dcfce7", fg: "#166534" },
  CANCELLED: { bg: "#fee2e2", fg: "#991b1b" },
};

export default function PurchaseDocument({ purchase }) {
  const supplier = purchase.supplier ?? {};
  const status = STATUS_COLORS[purchase.status] ?? STATUS_COLORS.DRAFT;
  const totalUnits = purchase.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <>
      <style>{`
        .po-sheet {
          width: 210mm;
          min-height: 297mm;
          padding: 14mm 14mm 12mm;
          background: #ffffff;
          color: #111827;
          font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
          font-size: 11px;
          line-height: 1.45;
          box-sizing: border-box;
          position: relative;
          display: flex;
          flex-direction: column;
        }
        .po-sheet table { border-collapse: collapse; width: 100%; }
        .po-sheet th, .po-sheet td { padding: 8px 10px; text-align: left; }
        .po-sheet tr { page-break-inside: avoid; }
        .po-bar { height: 6px; background: linear-gradient(90deg, #16a34a, #84cc16); border-radius: 3px; }

        @media print {
          @page { size: A4; margin: 0; }
          html, body { background: #ffffff !important; height: auto !important; overflow: visible !important; }
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area {
            position: absolute !important;
            left: 0; top: 0;
            margin: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          .po-sheet { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="print-area po-sheet mx-auto shadow-lg">
        <div className="po-bar" />

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 18 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={COMPANY.logo} alt={COMPANY.name} style={{ height: 56, width: 56, objectFit: "contain", borderRadius: 6 }} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#14532d" }}>{COMPANY.name}</div>
              <div style={{ color: "#6b7280" }}>{COMPANY.tagline}</div>
              <div style={{ color: "#6b7280" }}>
                {COMPANY.address} &bull; {COMPANY.phone}
              </div>
              <div style={{ color: "#6b7280" }}>{COMPANY.email}</div>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 1, color: "#14532d" }}>PURCHASE ORDER</div>
            <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{purchase.reference}</div>
            <span
              style={{
                display: "inline-block",
                marginTop: 6,
                padding: "2px 10px",
                borderRadius: 999,
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                background: status.bg,
                color: status.fg,
              }}
            >
              {purchase.status}
            </span>
          </div>
        </div>

        {/* Parties */}
        <div style={{ display: "flex", gap: 16, marginTop: 24 }}>
          <div style={{ flex: 1, border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: "#6b7280", textTransform: "uppercase" }}>
              Supplier
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>{supplier.name ?? "-"}</div>
            {supplier.contactName && <div>Attn: {supplier.contactName}</div>}
            {supplier.address && <div>{supplier.address}</div>}
            {supplier.phone && <div>Tel: {supplier.phone}</div>}
            {supplier.email && <div>{supplier.email}</div>}
          </div>

          <div style={{ flex: 1, border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: "#6b7280", textTransform: "uppercase" }}>
              Order Details
            </div>
            <table style={{ marginTop: 4 }}>
              <tbody>
                <tr>
                  <td style={{ padding: "2px 0", color: "#6b7280" }}>Order date</td>
                  <td style={{ padding: "2px 0", textAlign: "right", fontWeight: 600 }}>{fmtDate(purchase.purchasedAt)}</td>
                </tr>
                <tr>
                  <td style={{ padding: "2px 0", color: "#6b7280" }}>Reference</td>
                  <td style={{ padding: "2px 0", textAlign: "right", fontWeight: 600 }}>{purchase.reference}</td>
                </tr>
                <tr>
                  <td style={{ padding: "2px 0", color: "#6b7280" }}>Lines / units</td>
                  <td style={{ padding: "2px 0", textAlign: "right", fontWeight: 600 }}>
                    {purchase.items.length} / {totalUnits}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "2px 0", color: "#6b7280" }}>Currency</td>
                  <td style={{ padding: "2px 0", textAlign: "right", fontWeight: 600 }}>UGX</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Items */}
        <div style={{ marginTop: 24, border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
          <table>
            <thead>
              <tr style={{ background: "#14532d", color: "#ffffff", fontSize: 10, textTransform: "uppercase" }}>
                <th style={{ width: 28 }}>#</th>
                <th>Product</th>
                <th style={{ width: 90 }}>SKU</th>
                <th style={{ width: 44, textAlign: "right" }}>Qty</th>
                <th style={{ width: 90, textAlign: "right" }}>Unit Cost</th>
                <th style={{ width: 100, textAlign: "right" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {purchase.items.map((item, index) => (
                <tr key={item.id} style={{ background: index % 2 ? "#f9fafb" : "#ffffff", borderTop: "1px solid #f3f4f6" }}>
                  <td style={{ color: "#6b7280" }}>{index + 1}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{item.product?.name ?? "Deleted product"}</div>
                    {item.product?.brand && <div style={{ color: "#6b7280", fontSize: 10 }}>{item.product.brand}</div>}
                  </td>
                  <td style={{ color: "#6b7280" }}>{item.product?.sku ?? "-"}</td>
                  <td style={{ textAlign: "right" }}>{item.quantity}</td>
                  <td style={{ textAlign: "right" }}>{Number(item.unitCost).toLocaleString()}</td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>{Number(item.total).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals + notes */}
        <div style={{ display: "flex", gap: 16, marginTop: 20, alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            {purchase.notes && (
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: "#6b7280", textTransform: "uppercase" }}>
                  Notes
                </div>
                <div style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>{purchase.notes}</div>
              </div>
            )}
          </div>

          <div style={{ width: 240, border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
              <span style={{ color: "#6b7280" }}>Subtotal</span>
              <span>{money(purchase.subtotal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
              <span style={{ color: "#6b7280" }}>Tax</span>
              <span>{money(purchase.tax)}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 6,
                padding: "8px 10px",
                borderRadius: 6,
                background: "#14532d",
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              <span>Total</span>
              <span>{money(purchase.total)}</span>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div style={{ display: "flex", gap: 40, marginTop: "auto", paddingTop: 48 }}>
          {["Prepared by", "Approved by", "Supplier signature"].map((label) => (
            <div key={label} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ borderTop: "1px solid #9ca3af", paddingTop: 4, color: "#6b7280", fontSize: 10 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 20, textAlign: "center", color: "#9ca3af", fontSize: 9 }}>
          {COMPANY.name} &bull; {purchase.reference} &bull; Generated {fmtDate(new Date())}
        </div>
      </div>
    </>
  );
}