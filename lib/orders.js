// lib/orders.js
// Route: n/a (server logic: place and cancel orders)
import db from "@/lib/db";
import { isValidId } from "@/lib/staff";
import { PAYMENT_OPTIONS } from "@/lib/paymentOptions";
import { esc, sendMail } from "@/lib/mailer";

export class OrderError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export const formatUGX = (n) => `UGX ${Number(n || 0).toLocaleString("en-US")}`;

const unitPriceOf = (p) => (p.salePrice != null && p.salePrice > 0 && p.salePrice < p.price ? p.salePrice : p.price);

function newOrderNumber() {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `GP-${ymd}-${rand}`;
}

// Works with db or a transaction client
export async function resolveCoupon(client, code, subtotal) {
  const clean = String(code || "").trim();
  if (!clean) return { coupon: null, discount: 0 };

  const coupon = await client.coupon.findFirst({
    where: { couponCode: { equals: clean, mode: "insensitive" } },
  });
  if (!coupon || !coupon.isActive) throw new OrderError("Coupon code is not valid");
  if (new Date(coupon.expiryDate) < new Date()) throw new OrderError("This coupon has expired");
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit)
    throw new OrderError("This coupon has reached its usage limit");
  if (subtotal < coupon.minOrderTotal)
    throw new OrderError(`Minimum order for this coupon is ${formatUGX(coupon.minOrderTotal)}`);

  const raw = coupon.discountType === "PERCENTAGE" ? Math.round((subtotal * coupon.discountValue) / 100) : coupon.discountValue;
  return { coupon, discount: Math.max(0, Math.min(raw, subtotal)) };
}

export async function placeOrder({ user, name, phone, city, address, notes, paymentKey, couponCode, items }) {
  const option = PAYMENT_OPTIONS[paymentKey];
  if (!option) throw new OrderError("Choose a payment method");

  // merge duplicate lines and validate
  const wanted = new Map();
  for (const it of items || []) {
    const qty = Number(it?.qty);
    if (!isValidId(it?.productId) || !Number.isInteger(qty) || qty < 1 || qty > 100)
      throw new OrderError("Your cart contains an invalid item");
    wanted.set(it.productId, (wanted.get(it.productId) || 0) + qty);
  }
  if (wanted.size === 0) throw new OrderError("Your cart is empty");

  const fullAddress = [address, city].filter(Boolean).join(", ");
  const orderNotes = [`Customer: ${name}`, `Payment: ${option.label}`, notes && `Notes: ${notes}`].filter(Boolean).join("\n");

  return db.$transaction(
    async (tx) => {
      const ids = [...wanted.keys()];
      const products = await tx.product.findMany({ where: { id: { in: ids }, isActive: true } });
      const byId = new Map(products.map((p) => [p.id, p]));

      const lines = [];
      for (const [productId, qty] of wanted) {
        const p = byId.get(productId);
        if (!p) throw new OrderError("An item in your cart is no longer available", 409);
        if (p.stock < qty)
          throw new OrderError(
            p.stock > 0 ? `Only ${p.stock} of "${p.name}" left in stock` : `"${p.name}" is out of stock`,
            409
          );
        const unitPrice = unitPriceOf(p);
        lines.push({ p, qty, unitPrice, total: unitPrice * qty });
      }

      const subtotal = lines.reduce((s, l) => s + l.total, 0);
      const { coupon, discount } = await resolveCoupon(tx, couponCode, subtotal);
      const total = subtotal - discount;
      const orderNumber = newOrderNumber();

      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId: user.id,
          subtotal,
          discount,
          total,
          phone,
          address: fullAddress,
          notes: orderNotes,
          couponId: coupon?.id || null,
          items: {
            create: lines.map((l) => ({
              productId: l.p.id,
              quantity: l.qty,
              unitPrice: l.unitPrice,
              costPrice: l.p.costPrice || 0,
              total: l.total,
            })),
          },
        },
        include: { items: { include: { product: { select: { name: true, slug: true, imageUrls: true } } } } },
      });

      for (const l of lines) {
        // atomic: only decrements if enough stock is still there
        const res = await tx.product.updateMany({
          where: { id: l.p.id, stock: { gte: l.qty } },
          data: { stock: { decrement: l.qty } },
        });
        if (res.count === 0) throw new OrderError(`"${l.p.name}" just sold out`, 409);

        await tx.stockMovement.create({
          data: {
            productId: l.p.id,
            type: "SALE",
            quantity: -l.qty,
            balanceAfter: l.p.stock - l.qty,
            reference: orderNumber,
            notes: "Online order",
            createdById: user.id,
          },
        });
      }

      await tx.payment.create({
        data: {
          reference: `PAY-${orderNumber}`,
          orderId: order.id,
          customerId: user.id,
          recordedById: user.id,
          amount: total,
          method: option.method,
          status: "PENDING",
          notes: option.label,
        },
      });

      if (coupon) await tx.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });

      return { ...order, paymentLabel: option.label };
    },
    { maxWait: 10000, timeout: 20000 }
  );
}

export async function cancelOrder({ orderNumber, userId, isAdmin = false }) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { orderNumber }, include: { items: true } });
    if (!order || (!isAdmin && order.customerId !== userId)) throw new OrderError("Order not found", 404);
    if (order.status !== "PENDING") throw new OrderError("Only pending orders can be cancelled. Please contact us.", 409);

    await tx.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });

    for (const it of order.items) {
      const p = await tx.product.update({ where: { id: it.productId }, data: { stock: { increment: it.quantity } } });
      await tx.stockMovement.create({
        data: {
          productId: it.productId,
          type: "RETURN_IN",
          quantity: it.quantity,
          balanceAfter: p.stock,
          reference: orderNumber,
          notes: "Order cancelled",
          createdById: userId,
        },
      });
    }
    return order;
  });
}

// ---------- emails ----------
function itemsTable(order) {
  const rows = order.items
    .map(
      (i) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee">${esc(i.product?.name || "Item")} × ${i.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">${formatUGX(i.total)}</td>
      </tr>`
    )
    .join("");
  const discountRow = order.discount
    ? `<tr><td style="padding:6px 0">Discount</td><td style="text-align:right">- ${formatUGX(order.discount)}</td></tr>`
    : "";
  return `<table style="width:100%;border-collapse:collapse;font-size:14px">${rows}
    <tr><td style="padding:6px 0">Subtotal</td><td style="text-align:right">${formatUGX(order.subtotal)}</td></tr>
    ${discountRow}
    <tr><td style="padding:10px 0;font-weight:bold">Total</td><td style="text-align:right;font-weight:bold;color:#2563eb">${formatUGX(order.total)}</td></tr>
  </table>`;
}

const wrap = (title, body) => `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#111">
  <h2 style="color:#2563eb;margin-bottom:4px">Green Planet Computers</h2>
  <h3 style="margin-top:0">${title}</h3>${body}
  <p style="color:#777;font-size:12px;margin-top:24px">Kampala Plaza, next to E-Tower, Kampala Road · Shop No. B8 · 0789 033 647 / 0701 055 646</p>
</div>`;

export async function sendOrderEmails({ order, user, baseUrl }) {
  const link = `${baseUrl}/account/orders/${order.orderNumber}`;
  const payNote = PAYMENT_HINTS(order.paymentLabel);

  await sendMail({
    to: user.email,
    subject: `Order ${order.orderNumber} received`,
    html: wrap(
      `Thank you, ${esc(user.name)}!`,
      `<p>We received your order <b>${esc(order.orderNumber)}</b>. We will contact you to confirm delivery.</p>
       ${itemsTable(order)}
       <p><b>Payment:</b> ${esc(order.paymentLabel)}<br>${esc(payNote)}</p>
       <p><b>Deliver to:</b> ${esc(order.address)}<br><b>Phone:</b> ${esc(order.phone)}</p>
       <p><a href="${link}" style="background:#2563eb;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">View your order</a></p>`
    ),
  });

  await sendMail({
    to: process.env.STORE_NOTIFY_EMAIL,
    replyTo: user.email,
    subject: `New online order ${order.orderNumber} — ${formatUGX(order.total)}`,
    html: wrap(
      "New order",
      `<p><b>${esc(user.name)}</b> (${esc(user.email)}, ${esc(order.phone)}) placed an order.</p>
       ${itemsTable(order)}
       <p><b>Payment:</b> ${esc(order.paymentLabel)}<br><b>Address:</b> ${esc(order.address)}</p>
       <pre style="white-space:pre-wrap;font-family:inherit">${esc(order.notes || "")}</pre>`
    ),
  });
}

function PAYMENT_HINTS(label) {
  if (/Mobile Money|Airtel/i.test(label)) return "We will email you mobile money payment instructions shortly.";
  if (/Bank/i.test(label)) return "We will email you our bank details shortly.";
  return "Please have the amount ready when your order arrives.";
}

export async function sendCancelEmail({ order, user }) {
  await sendMail({
    to: user.email,
    subject: `Order ${order.orderNumber} cancelled`,
    html: wrap("Order cancelled", `<p>Your order <b>${esc(order.orderNumber)}</b> has been cancelled.</p>`),
  });
}