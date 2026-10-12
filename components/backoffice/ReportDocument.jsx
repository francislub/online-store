// components/backoffice/ReportDocument.jsx
// Route: n/a (A4 business report, shown on /dashboard/reports and printed to PDF)
"use client";

import React from "react";

const COMPANY = {
  name: "GREEN PLANET COMPUTERS",
  location: "Kampala Plaza Next E-Tower Kampala Road, Shop No. B8",
  tel: "Tel: 0789 033 647 | 0701 055 646",
  logo: "/images/logo.jpeg",
};

const num = (v) => Number(v ?? 0).toLocaleString();
const money = (v) => `UGX ${num(v)}`;
const fmtDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-";
const label = (s) => String(s).replace(/_/g, " ").toLowerCase();
const fmtKey = (key, groupBy) => {
  if (groupBy === "month") {
    const [y, m] = key.split("-");
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
  }
  return fmtDate(`${key}T12:00:00+03:00`);
};

const BORDER = "1px solid #e5e7eb";
const GREEN = "#14532d";

function Section({ title, children, style }) {
  return (
    <div className="rp-section" style={{ marginTop: 18, ...style }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: GREEN, textTransform: "uppercase", marginBottom: 6 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Bar({ value, max, color = "#84cc16" }) {
  const width = max > 0 ? Math.min(100, (Math.max(value, 0) / max) * 100) : 0;
  return (
    <div style={{ background: "#f3f4f6", height: 7, borderRadius: 4 }}>
      <div style={{ width: `${width}%`, height: 7, borderRadius: 4, background: color }} />
    </div>
  );
}

function Kpi({ title, value, sub, color = "#111827" }) {
  return (
    <div style={{ flex: 1, border: BORDER, borderRadius: 8, padding: "10px 12px" }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: "#6b7280", textTransform: "uppercase" }}>{title}</div>
      <div style={{ fontSize: 15, fontWeight: 800, color, marginTop: 2 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: "#6b7280" }}>{sub}</div>}
    </div>
  );
}

export default function ReportDocument({ report }) {
  const { summary: s, range, timeline, topProducts, expenseByCategory, paymentsByMethod, receivables, payables, stock } = report;
  const maxSales = Math.max(...timeline.map((t) => t.sales), 0);
  const maxExpense = Math.max(...expenseByCategory.map((e) => e.amount), 0);
  const maxMethod = Math.max(...paymentsByMethod.map((p) => p.amount), 0);
  const profitColor = s.netProfit >= 0 ? "#166534" : "#b91c1c";

  const plRows = [
    ["Sales (order totals)", money(s.revenue)],
    ["Less: refunds", `- ${money(s.refunds)}`],
    ["Net sales", money(s.netSales), true],
    ["Cost of goods sold", `- ${money(s.cogs)}`],
    [`Gross profit (${s.grossMargin}%)`, money(s.grossProfit), true],
    ["Operating expenses", `- ${money(s.expenses)}`],
    [`Net profit (${s.netMargin}%)`, money(s.netProfit), true],
  ];

  return (
    <>
      <style>{`
        .rp-sheet {
          width: 210mm;
          min-height: 297mm;
          padding: 12mm;
          background: #ffffff;
          color: #111827;
          font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
          font-size: 11px;
          line-height: 1.4;
          box-sizing: border-box;
        }
        .rp-sheet table { border-collapse: collapse; width: 100%; }
        .rp-sheet th, .rp-sheet td { padding: 5px 8px; text-align: left; }
        .rp-sheet th { background: ${GREEN}; color: #fff; font-size: 9px; text-transform: uppercase; }
        .rp-sheet tbody tr { border-top: 1px solid #f3f4f6; }
        .rp-sheet tr, .rp-section { page-break-inside: avoid; }
        .rp-right { text-align: right !important; }

        @media print {
          @page { size: A4; margin: 8mm; }
          html, body { background: #ffffff !important; height: auto !important; overflow: visible !important; }
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area {
            position: absolute !important;
            left: 0; top: 0;
            width: 100% !important;
            min-height: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
          }
          .rp-sheet { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="print-area rp-sheet mx-auto shadow-lg">
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, borderBottom: `3px solid ${GREEN}`, paddingBottom: 10 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={COMPANY.logo} alt="Green Planet Computers" style={{ height: 56, width: 56, objectFit: "contain" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{COMPANY.name}</div>
            <div style={{ color: "#6b7280" }}>{COMPANY.location}</div>
            <div style={{ color: "#6b7280" }}>{COMPANY.tel}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: GREEN }}>BUSINESS REPORT</div>
            <div style={{ fontWeight: 600 }}>
              {fmtDate(`${range.from}T12:00:00+03:00`)} to {fmtDate(`${range.to}T12:00:00+03:00`)}
            </div>
            <div style={{ color: "#6b7280", fontSize: 10 }}>Generated {fmtDate(new Date())}</div>
          </div>
        </div>

        {/* KPIs */}
        <div className="rp-section" style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <Kpi title="Net sales" value={money(s.netSales)} sub={`${s.orderCount} orders`} />
          <Kpi title="Gross profit" value={money(s.grossProfit)} sub={`${s.grossMargin}% margin`} />
          <Kpi title="Expenses" value={money(s.expenses)} />
          <Kpi title="Net profit" value={money(s.netProfit)} sub={`${s.netMargin}% margin`} color={profitColor} />
        </div>

        {/* Profit and loss */}
        <Section title="Profit & loss">
          <table style={{ border: BORDER }}>
            <tbody>
              {plRows.map(([name, value, strong]) => (
                <tr key={name} style={{ background: strong ? "#f0fdf4" : "#fff", fontWeight: strong ? 700 : 400 }}>
                  <td>{name}</td>
                  <td className="rp-right">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 6, color: "#6b7280", fontSize: 10 }}>
            Average order {money(s.avgOrderValue)} &bull; Discounts given {money(s.discounts)} &bull; Tax charged {money(s.tax)} &bull; Cash
            collected {money(s.cashCollected)} &bull; Stock purchased (received) {money(s.purchasesReceived)} in {s.purchaseCount} purchase(s)
          </div>
        </Section>

        {/* Timeline */}
        <Section title={range.groupBy === "month" ? "Sales by month" : "Sales by day"}>
          <table style={{ border: BORDER }}>
            <thead>
              <tr>
                <th>{range.groupBy === "month" ? "Month" : "Date"}</th>
                <th className="rp-right">Orders</th>
                <th className="rp-right">Sales</th>
                <th style={{ width: "28%" }}>&nbsp;</th>
                <th className="rp-right">Expenses</th>
              </tr>
            </thead>
            <tbody>
              {timeline.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "#6b7280" }}>No activity in this period</td>
                </tr>
              )}
              {timeline.map((t) => (
                <tr key={t.key}>
                  <td>{fmtKey(t.key, range.groupBy)}</td>
                  <td className="rp-right">{t.orders}</td>
                  <td className="rp-right">{num(t.sales)}</td>
                  <td><Bar value={t.sales} max={maxSales} /></td>
                  <td className="rp-right">{num(t.expenses)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* Top products */}
        <Section title="Top selling products">
          <table style={{ border: BORDER }}>
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>SKU</th>
                <th className="rp-right">Qty</th>
                <th className="rp-right">Revenue</th>
                <th className="rp-right">Profit</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "#6b7280" }}>No sales in this period</td>
                </tr>
              )}
              {topProducts.map((p, i) => (
                <tr key={`${p.sku}-${i}`}>
                  <td>{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td style={{ color: "#6b7280" }}>{p.sku}</td>
                  <td className="rp-right">{p.quantity}</td>
                  <td className="rp-right">{num(p.revenue)}</td>
                  <td className="rp-right" style={{ color: p.profit >= 0 ? "#166534" : "#b91c1c" }}>{num(p.profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* Expenses + payments */}
        <div style={{ display: "flex", gap: 16 }}>
          <Section title="Expenses by category" style={{ flex: 1 }}>
            <div style={{ border: BORDER, borderRadius: 8, padding: 10 }}>
              {expenseByCategory.length === 0 && <div style={{ color: "#6b7280" }}>No expenses in this period</div>}
              {expenseByCategory.map((e) => (
                <div key={e.category} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", textTransform: "capitalize" }}>
                    <span>{label(e.category)}</span>
                    <strong>{num(e.amount)}</strong>
                  </div>
                  <Bar value={e.amount} max={maxExpense} color="#f97316" />
                </div>
              ))}
            </div>
          </Section>

          <Section title="Money collected by method" style={{ flex: 1 }}>
            <div style={{ border: BORDER, borderRadius: 8, padding: 10 }}>
              {paymentsByMethod.length === 0 && <div style={{ color: "#6b7280" }}>No payments in this period</div>}
              {paymentsByMethod.map((p) => (
                <div key={p.method} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", textTransform: "capitalize" }}>
                    <span>{label(p.method)}</span>
                    <strong>{num(p.amount)}</strong>
                  </div>
                  <Bar value={p.amount} max={maxMethod} color="#3b82f6" />
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* Receivables + payables */}
        <div style={{ display: "flex", gap: 16 }}>
          <Section title="Customers owe us (unpaid invoices)" style={{ flex: 1 }}>
            <div style={{ border: BORDER, borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 800 }}>{money(receivables.total)}</div>
              <div style={{ color: "#6b7280", marginBottom: 6 }}>
                {receivables.count} invoice(s) &bull; overdue {money(receivables.overdueTotal)} ({receivables.overdueCount})
              </div>
              {receivables.top.map((i) => (
                <div key={i.number} style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #f3f4f6", padding: "3px 0" }}>
                  <span>{i.number} &bull; {i.customerName ?? "-"}</span>
                  <strong>{num(i.balance)}</strong>
                </div>
              ))}
            </div>
          </Section>

          <Section title="We owe suppliers" style={{ flex: 1 }}>
            <div style={{ border: BORDER, borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 800 }}>{money(payables.total)}</div>
              <div style={{ color: "#6b7280", marginBottom: 6 }}>{payables.count} supplier(s) with a balance</div>
              {payables.top.map((p) => (
                <div key={p.name} style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #f3f4f6", padding: "3px 0" }}>
                  <span>{p.name}</span>
                  <strong>{num(p.balance)}</strong>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* Stock */}
        <Section title="Stock position (today)">
          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <Kpi title="Products" value={num(stock.productCount)} sub={`${num(stock.units)} units`} />
            <Kpi title="Stock value (cost)" value={money(stock.costValue)} />
            <Kpi title="Stock value (retail)" value={money(stock.retailValue)} />
            <Kpi title="Out of stock" value={num(stock.outOfStock)} color={stock.outOfStock ? "#b91c1c" : "#111827"} />
          </div>
          <table style={{ border: BORDER }}>
            <thead>
              <tr>
                <th>Low / out of stock product</th>
                <th>SKU</th>
                <th className="rp-right">In stock</th>
                <th className="rp-right">Reorder level</th>
              </tr>
            </thead>
            <tbody>
              {stock.lowStock.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", color: "#6b7280" }}>All products are above their reorder level</td>
                </tr>
              )}
              {stock.lowStock.map((p) => (
                <tr key={p.sku}>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td style={{ color: "#6b7280" }}>{p.sku}</td>
                  <td className="rp-right" style={{ color: p.stock <= 0 ? "#b91c1c" : "#111827", fontWeight: 700 }}>{p.stock}</td>
                  <td className="rp-right">{p.reorderLevel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <div style={{ marginTop: 20, textAlign: "center", color: "#9ca3af", fontSize: 9 }}>
          {COMPANY.name} &bull; Report {range.from} to {range.to} &bull; Generated from live database records
        </div>
      </div>
    </>
  );
}