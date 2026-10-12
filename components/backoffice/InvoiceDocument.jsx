// File: src/components/backoffice/InvoiceDocument.jsx
// Route: n/a (A4 invoice sheet, shown on /dashboard/invoices/[id] and printed to PDF)
"use client";

import React from "react";
import { amountInWords, fmtDate, plain } from "@/lib/invoiceFormat";

const COMPANY = {
  name: "GREEN PLANET COMPUTERS",
  dealers: "Dealers in: Sales, Repair & Maintenance of Laptops, Computer & Accessories",
  location: "Kampala Plaza, next to E-Tower, Kampala Road",
  shop: "Shop No. B8",
  tel: "0789 033 647 | 0701 055 646",
  logo: "/images/logo.jpeg",
};

const ACCENT = "#3f6212"; // dark lime / green
const ACCENT_SOFT = "#f3f8e8";
const INK = "#111827";
const MUTED = "#6b7280";
const LINE = "#d1d5db";

const MIN_ROWS = 8; // light filler rows so short invoices still look like a full sheet

const STATUS_LABEL = {
  DRAFT: "Draft",
  ISSUED: "Issued",
  SENT: "Sent",
  PAID: "Paid",
  OVERDUE: "Overdue",
  VOID: "Void",
};

export default function InvoiceDocument({ invoice }) {
  const items = invoice.items ?? [];
  const blanks = Math.max(0, MIN_ROWS - items.length);
  const isVoid = invoice.status === "VOID";
  const isPaid = invoice.status === "PAID";
  const showStamp = isVoid || isPaid;
  const stampColor = isVoid ? "rgba(220,38,38,0.16)" : "rgba(22,163,74,0.16)";

  const summary = [
    ["Subtotal", plain(invoice.subtotal)],
    invoice.tax > 0 && ["Tax", plain(invoice.tax)],
    invoice.discount > 0 && ["Discount", `- ${plain(invoice.discount)}`],
  ].filter(Boolean);

  return (
    <>
      <style>{`
        .inv-sheet {
          width: 210mm;
          min-height: 296mm;
          padding: 11mm 13mm 10mm;
          background: #ffffff;
          color: ${INK};
          font-family: "Helvetica Neue", Arial, Helvetica, sans-serif;
          font-size: 12px;
          line-height: 1.4;
          box-sizing: border-box;
          position: relative;
          display: flex;
          flex-direction: column;
        }
        .inv-sheet table { border-collapse: collapse; width: 100%; }
        .inv-sheet thead { display: table-header-group; }
        .inv-sheet tr { page-break-inside: avoid; break-inside: avoid; }
        .inv-sheet th {
          background: ${ACCENT};
          color: #ffffff;
          font-size: 10.5px;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          padding: 8px 10px;
        }
        .inv-sheet td { padding: 8px 10px; border-bottom: 1px solid ${LINE}; vertical-align: top; }
        .inv-sheet tbody tr:nth-child(even) td { background: #fafafa; }
        .inv-label { font-size: 9.5px; letter-spacing: 0.8px; text-transform: uppercase; color: ${MUTED}; font-weight: 700; }

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
          .inv-sheet, .inv-sheet * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="print-area inv-sheet mx-auto shadow-lg">
        {/* Top accent bar */}
        <div style={{ height: 6, background: ACCENT, borderRadius: 3, marginBottom: 14 }} />

        {/* Header: company (left) + invoice title (right) */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 20, alignItems: "flex-start" }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center", flex: 1 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={COMPANY.logo} alt={COMPANY.name} style={{ height: 76, width: 76, objectFit: "contain" }} />
            <div>
              <div style={{ fontSize: 21, fontWeight: 800, color: ACCENT, letterSpacing: 0.3 }}>{COMPANY.name}</div>
              <div style={{ fontSize: 10.5, color: MUTED, marginTop: 2, maxWidth: 320 }}>{COMPANY.dealers}</div>
              <div style={{ fontSize: 11, marginTop: 4 }}>
                {COMPANY.location}, {COMPANY.shop}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700 }}>Tel: {COMPANY.tel}</div>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: 2, color: INK, lineHeight: 1 }}>INVOICE</div>
            <div style={{ marginTop: 8, fontSize: 15, fontWeight: 800, color: "#dc2626" }}>{invoice.number}</div>
            <div
              style={{
                display: "inline-block",
                marginTop: 6,
                padding: "2px 10px",
                borderRadius: 999,
                background: ACCENT_SOFT,
                color: ACCENT,
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: 0.6,
                textTransform: "uppercase",
              }}
            >
              {STATUS_LABEL[invoice.status] ?? invoice.status}
            </div>
          </div>
        </div>

        {/* Bill to + dates */}
        <div style={{ display: "flex", gap: 14, marginTop: 18 }}>
          <div style={{ flex: 1.6, border: `1px solid ${LINE}`, borderRadius: 8, padding: "10px 12px" }}>
            <div className="inv-label">Billed to (M/s)</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 3 }}>{invoice.customerName || "Walk-in customer"}</div>
            <div style={{ fontSize: 11, color: "#374151", marginTop: 3 }}>
              {invoice.customerPhone && <div>Tel: {invoice.customerPhone}</div>}
              {invoice.customerEmail && <div>{invoice.customerEmail}</div>}
              {invoice.customerAddress && <div>{invoice.customerAddress}</div>}
              {invoice.customerTin && <div>TIN: {invoice.customerTin}</div>}
            </div>
          </div>

          <div style={{ flex: 1, border: `1px solid ${LINE}`, borderRadius: 8, padding: "10px 12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span className="inv-label">Invoice date</span>
              <span style={{ fontWeight: 700 }}>{fmtDate(invoice.issuedAt)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span className="inv-label">Due date</span>
              <span style={{ fontWeight: 700 }}>{invoice.dueAt ? fmtDate(invoice.dueAt) : "On receipt"}</span>
            </div>
            {invoice.order?.orderNumber && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="inv-label">Order ref</span>
                <span style={{ fontWeight: 700 }}>{invoice.order.orderNumber}</span>
              </div>
            )}
          </div>
        </div>

        {/* Items */}
        <div style={{ marginTop: 16, border: `1px solid ${LINE}`, borderRadius: 8, overflow: "hidden" }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: 34, textAlign: "center" }}>#</th>
                <th style={{ textAlign: "left" }}>Description</th>
                <th style={{ width: 52, textAlign: "center" }}>Qty</th>
                <th style={{ width: 96, textAlign: "right" }}>Rate</th>
                <th style={{ width: 110, textAlign: "right" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id ?? index}>
                  <td style={{ textAlign: "center", color: MUTED }}>{index + 1}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{item.description}</div>
                    {item.details && <div style={{ fontSize: 10, color: MUTED, marginTop: 1 }}>{item.details}</div>}
                  </td>
                  <td style={{ textAlign: "center" }}>{item.quantity}</td>
                  <td style={{ textAlign: "right" }}>{plain(item.unitPrice)}</td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>{plain(item.total)}</td>
                </tr>
              ))}
              {Array.from({ length: blanks }).map((_, i) => (
                <tr key={`blank-${i}`}>
                  <td>&nbsp;</td>
                  <td />
                  <td />
                  <td />
                  <td />
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Words + totals */}
        <div style={{ display: "flex", gap: 18, marginTop: 14, alignItems: "flex-start", breakInside: "avoid" }}>
          <div style={{ flex: 1 }}>
            <div className="inv-label">Amount in words</div>
            <div style={{ fontSize: 11.5, fontWeight: 600, marginTop: 3, fontStyle: "italic" }}>
              {amountInWords(invoice.total)}
            </div>

            {invoice.notes && (
              <div style={{ marginTop: 14 }}>
                <div className="inv-label">Notes</div>
                <div style={{ whiteSpace: "pre-wrap", fontSize: 11, marginTop: 3 }}>{invoice.notes}</div>
              </div>
            )}
          </div>

          <div style={{ width: 250, border: `1px solid ${LINE}`, borderRadius: 8, overflow: "hidden" }}>
            {summary.map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 12px" }}>
                <span style={{ color: "#374151" }}>{label}</span>
                <span>{value}</span>
              </div>
            ))}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "9px 12px",
                background: ACCENT,
                color: "#ffffff",
                fontWeight: 800,
                fontSize: 14,
              }}
            >
              <span>TOTAL (UGX)</span>
              <span>{plain(invoice.total)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 12px" }}>
              <span style={{ color: "#374151" }}>Amount paid</span>
              <span>{plain(invoice.amountPaid)}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 12px",
                borderTop: `1px solid ${LINE}`,
                background: ACCENT_SOFT,
                fontWeight: 800,
              }}
            >
              <span>Balance due</span>
              <span>{plain(invoice.balance)}</span>
            </div>
          </div>
        </div>

        {/* Signatures + footer pinned to the bottom of the sheet */}
        <div style={{ marginTop: "auto", paddingTop: 36, breakInside: "avoid" }}>
          <div style={{ display: "flex", gap: 60 }}>
            {["Issued by", "Received by (name & signature)"].map((label) => (
              <div key={label} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ borderTop: `1px solid ${INK}`, paddingTop: 4, fontSize: 10.5, color: "#374151" }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: 16,
              paddingTop: 8,
              borderTop: `1px solid ${LINE}`,
              textAlign: "center",
              fontSize: 10,
              color: MUTED,
            }}
          >
            Thank you for your business. Goods once sold are not returnable unless covered by warranty.
          </div>
        </div>

        {/* Stamp for paid / void */}
        {showStamp && (
          <div
            style={{
              position: "absolute",
              top: "46%",
              left: "50%",
              transform: "translate(-50%, -50%) rotate(-18deg)",
              fontSize: 84,
              fontWeight: 900,
              letterSpacing: 8,
              color: stampColor,
              border: `8px solid ${stampColor}`,
              padding: "0 26px",
              borderRadius: 14,
              pointerEvents: "none",
            }}
          >
            {isVoid ? "VOID" : "PAID"}
          </div>
        )}
      </div>
    </>
  );
}
