// components/backoffice/InvoiceDocument.jsx
// Route: n/a (A4 invoice sheet, shown on /dashboard/invoices/[id] and printed to PDF)
"use client";

import React from "react";

const COMPANY = {
  name: "GREEN PLANET COMPUTERS",
  dealers: "Dealers in: Sales, Repair & Maintenance of Laptops, Computer & accessories.",
  location: "Location: Kampala Plaza Next E-Tower Kampala Road",
  shop: "Shop No. B8",
  tel: "Tel: 0789 033 647 | 0701 055 646",
  logo: "/images/logo.jpeg",
};

const MIN_ROWS = 14; // blank rows so the sheet looks like the paper book
const num = (v) => Number(v ?? 0).toLocaleString();
const fmtDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }) : "";

const BORDER = "1.5px solid #111827";
const box = { border: BORDER, borderRadius: 6 };

export default function InvoiceDocument({ invoice }) {
  const items = invoice.order?.items ?? [];
  const blanks = Math.max(0, MIN_ROWS - items.length);
  const isVoid = invoice.status === "VOID";

  return (
    <>
      <style>{`
        .inv-sheet {
          width: 210mm;
          min-height: 297mm;
          padding: 10mm 12mm;
          background: #ffffff;
          color: #111827;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 12px;
          box-sizing: border-box;
          position: relative;
          display: flex;
          flex-direction: column;
        }
        .inv-sheet table { border-collapse: collapse; width: 100%; }
        .inv-sheet tr { page-break-inside: avoid; }
        .inv-cell { border-left: ${BORDER}; padding: 5px 8px; }
        .inv-cell:first-child { border-left: none; }

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
          .inv-sheet { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="print-area inv-sheet mx-auto shadow-lg">
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={COMPANY.logo} alt="Green Planet Computers" style={{ height: 84, width: 84, objectFit: "contain" }} />
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: 0.5 }}>{COMPANY.name}</div>
            <div style={{ fontSize: 11, fontWeight: 600, marginTop: 2 }}>{COMPANY.dealers}</div>
            <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2 }}>{COMPANY.location}</div>
            <div style={{ fontSize: 12, fontWeight: 700 }}>{COMPANY.shop}</div>
            <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2 }}>{COMPANY.tel}</div>
          </div>
        </div>

        {/* Tin No + INVOICE title */}
        <div style={{ display: "flex", alignItems: "center", marginTop: 14, gap: 16 }}>
          <div style={{ ...box, flex: 1.2, padding: "8px 10px", fontWeight: 600 }}>
            Tin No.: <span style={{ fontWeight: 400 }}>{invoice.customerTin ?? ""}</span>
          </div>
          <div style={{ flex: 1, textAlign: "right", fontSize: 34, fontWeight: 800, letterSpacing: 1 }}>INVOICE</div>
        </div>

        {/* M/s + Date + No. */}
        <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
          <div style={{ ...box, flex: 1.7, padding: "8px 10px", minHeight: 62 }}>
            <span style={{ fontWeight: 700 }}>M/s</span>{" "}
            <span style={{ fontSize: 15, fontWeight: 600, borderBottom: "1px solid #111827" }}>
              {invoice.customerName ?? "-"}
            </span>
            {invoice.order?.phone && <div style={{ marginTop: 6, fontSize: 11 }}>Tel: {invoice.order.phone}</div>}
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ ...box, padding: "8px 10px", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 700 }}>Date</span>
              <span style={{ fontWeight: 600 }}>{fmtDate(invoice.issuedAt)}</span>
            </div>
            <div style={{ ...box, padding: "8px 10px", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 700 }}>No.</span>
              <span style={{ fontWeight: 800, fontSize: 15, color: "#dc2626" }}>{invoice.number}</span>
            </div>
          </div>
        </div>

        {/* Items table */}
        <div style={{ ...box, marginTop: 12, overflow: "hidden" }}>
          <table>
            <thead>
              <tr style={{ borderBottom: BORDER, fontSize: 14 }}>
                <th className="inv-cell" style={{ width: 60, textAlign: "left" }}>Qty</th>
                <th className="inv-cell" style={{ textAlign: "center" }}>Particulars</th>
                <th className="inv-cell" style={{ width: 100, textAlign: "center" }}>Rate</th>
                <th className="inv-cell" style={{ width: 120, textAlign: "center" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="inv-cell">{item.quantity}</td>
                  <td className="inv-cell">
                    <div style={{ fontWeight: 600 }}>{item.product?.name ?? "Deleted product"}</div>
                    <div style={{ fontSize: 10, color: "#4b5563" }}>
                      {[item.product?.brand, item.product?.model, item.product?.sku && `SKU: ${item.product.sku}`]
                        .filter(Boolean)
                        .join(" • ")}
                    </div>
                  </td>
                  <td className="inv-cell" style={{ textAlign: "right" }}>{num(item.unitPrice)}</td>
                  <td className="inv-cell" style={{ textAlign: "right", fontWeight: 600 }}>{num(item.total)}</td>
                </tr>
              ))}
              {Array.from({ length: blanks }).map((_, i) => (
                <tr key={`blank-${i}`}>
                  <td className="inv-cell">&nbsp;</td>
                  <td className="inv-cell" />
                  <td className="inv-cell" />
                  <td className="inv-cell" />
                </tr>
              ))}
            </tbody>
            <tfoot>
              {[
                ["Subtotal", num(invoice.subtotal)],
                invoice.tax > 0 && ["Tax", num(invoice.tax)],
                invoice.discount > 0 && ["Discount", `- ${num(invoice.discount)}`],
              ]
                .filter(Boolean)
                .map(([label, value]) => (
                  <tr key={label} style={{ borderTop: label === "Subtotal" ? BORDER : "none" }}>
                    <td className="inv-cell" colSpan={3} style={{ textAlign: "right", fontWeight: 600 }}>{label}</td>
                    <td className="inv-cell" style={{ textAlign: "right" }}>{value}</td>
                  </tr>
                ))}
              <tr style={{ borderTop: BORDER, fontSize: 14 }}>
                <td className="inv-cell" colSpan={3} style={{ textAlign: "right", fontWeight: 800 }}>TOTAL (UGX)</td>
                <td className="inv-cell" style={{ textAlign: "right", fontWeight: 800 }}>{num(invoice.total)}</td>
              </tr>
              <tr style={{ borderTop: "1px solid #9ca3af" }}>
                <td className="inv-cell" colSpan={3} style={{ textAlign: "right", fontWeight: 600 }}>Amount paid</td>
                <td className="inv-cell" style={{ textAlign: "right" }}>{num(invoice.amountPaid)}</td>
              </tr>
              <tr style={{ borderTop: "1px solid #9ca3af" }}>
                <td className="inv-cell" colSpan={3} style={{ textAlign: "right", fontWeight: 800 }}>Balance due</td>
                <td className="inv-cell" style={{ textAlign: "right", fontWeight: 800 }}>{num(invoice.balance)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Notes + due date */}
        <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", gap: 16 }}>
          <div style={{ flex: 1 }}>
            {invoice.notes && (
              <>
                <div style={{ fontWeight: 700 }}>Notes</div>
                <div style={{ whiteSpace: "pre-wrap" }}>{invoice.notes}</div>
              </>
            )}
          </div>
          {invoice.dueAt && (
            <div style={{ textAlign: "right" }}>
              <span style={{ fontWeight: 700 }}>Due date: </span>
              {fmtDate(invoice.dueAt)}
            </div>
          )}
        </div>

        {/* Signatures */}
        <div style={{ display: "flex", gap: 60, marginTop: "auto", paddingTop: 40 }}>
          {["Issued by", "Received by (name & signature)"].map((label) => (
            <div key={label} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ borderTop: "1px solid #111827", paddingTop: 4, fontSize: 11 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Stamp for paid / void */}
        {(invoice.status === "PAID" || isVoid) && (
          <div
            style={{
              position: "absolute",
              top: "42%",
              left: "50%",
              transform: "translate(-50%, -50%) rotate(-18deg)",
              fontSize: 80,
              fontWeight: 900,
              letterSpacing: 6,
              color: isVoid ? "rgba(220,38,38,0.18)" : "rgba(22,163,74,0.18)",
              border: `8px solid ${isVoid ? "rgba(220,38,38,0.18)" : "rgba(22,163,74,0.18)"}`,
              padding: "0 24px",
              borderRadius: 12,
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