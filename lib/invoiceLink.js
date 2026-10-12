// lib/invoiceLink.js
// Adapter for the Order <-> Invoice relation change.
// Order.invoice (one-to-one)  ->  Order.invoices (one-to-many, because an order is now optional on an invoice
// and a voided invoice can be replaced).
//
// These helpers let the routes keep returning `order.invoice` (the active, non-void invoice) so the
// frontend does not have to change.

const DEFAULT_INVOICE_SELECT = {
  id: true,
  number: true,
  status: true,
  total: true,
  amountPaid: true,
  balance: true,
  customerName: true,
};

// Args for the `invoices` relation: newest non-void invoice only
function activeInvoiceArgs(old) {
  const base = old && typeof old === "object" ? old : { select: DEFAULT_INVOICE_SELECT };
  return {
    ...base,
    where: { status: { not: "VOID" } },
    orderBy: { createdAt: "desc" },
    take: 1,
  };
}

// Rewrites { invoice: ... } inside a select/include object into { invoices: ... }
function patchKeys(obj) {
  if (!obj || typeof obj !== "object" || !("invoice" in obj)) return obj;
  const { invoice, ...rest } = obj;
  return { ...rest, invoices: activeInvoiceArgs(invoice) };
}

// For the include/select used on an Order (e.g. the service's `orderInclude`)
export function fixOrderInclude(include) {
  return patchKeys(include);
}

// For an include that nests an order (e.g. the service's `returnInclude`)
export function fixReturnInclude(include) {
  if (!include || typeof include !== "object" || !include.order || include.order === true) return include;
  const order = include.order;
  const key = order.select ? "select" : order.include ? "include" : null;
  if (!key) return include;
  return { ...include, order: { ...order, [key]: patchKeys(order[key]) } };
}

// order.invoices[] -> order.invoice (active one or null)
export function withInvoice(order) {
  if (!order || !Array.isArray(order.invoices)) return order;
  const { invoices, ...rest } = order;
  return { ...rest, invoice: invoices[0] ?? null };
}

// return.order.invoices[] -> return.order.invoice
export function withReturnInvoice(ret) {
  if (!ret || !ret.order) return ret;
  return { ...ret, order: withInvoice(ret.order) };
}

// Where-clauses for searching by the order's invoice
export function invoiceSearch(search) {
  return [
    { invoices: { some: { customerName: { contains: search, mode: "insensitive" } } } },
    { invoices: { some: { number: { contains: search, mode: "insensitive" } } } },
  ];
}

export const ORDER_LIST_INVOICE_ARGS = activeInvoiceArgs();