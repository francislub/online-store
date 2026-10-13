// app/api/storefront/checkout/route.js
// POST /api/storefront/checkout
// body: { items:[{id, qty}], name, phone, email?, address, city?, notes?, paymentMethod?,
//         saveAddress?, createAccount?, password? }
// Prices and stock are always read from the database, never trusted from the client.
import db from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { createSession, getCustomer, jsonError } from "@/lib/customerAuth";

export const runtime = "nodejs";

class CheckoutError extends Error {
  constructor(message, status = 409) {
    super(message);
    this.status = status;
  }
}

const PAYMENT_LABELS = {
  COD: "Pay on delivery",
  MOBILE_MONEY: "Mobile money",
  BANK_TRANSFER: "Bank transfer",
};

export async function POST(request) {
  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const email = String(body.email ?? "").toLowerCase().trim();
    const address = String(body.address ?? "").trim();
    const city = String(body.city ?? "").trim();
    const notes = String(body.notes ?? "").trim();
    const payment = PAYMENT_LABELS[body.paymentMethod] ? body.paymentMethod : "COD";

    if (!name) return jsonError("Your name is required");
    if (phone.replace(/\D/g, "").length < 9) return jsonError("Enter a valid phone number");
    if (!address) return jsonError("Delivery address is required");
    if (email && !/^\S+@\S+\.\S+$/.test(email)) return jsonError("Enter a valid email address");

    // merge duplicate lines
    const wanted = new Map();
    for (const it of Array.isArray(body.items) ? body.items : []) {
      const qty = Math.floor(Number(it?.qty));
      if (!/^[a-f\d]{24}$/i.test(String(it?.id)) || !(qty > 0)) continue;
      wanted.set(it.id, (wanted.get(it.id) || 0) + qty);
    }
    if (wanted.size === 0) return jsonError("Your cart is empty");

    // who is ordering?
    let customer = await getCustomer();
    let accountCreated = false;

    if (!customer && body.createAccount) {
      const password = String(body.password ?? "");
      if (!email) return jsonError("Email is required to create an account");
      if (password.length < 8) return jsonError("Password must be at least 8 characters");
      const exists = await db.user.findUnique({ where: { email } });
      if (exists) return jsonError("An account with this email already exists. Please log in.", 409, "EMAIL_EXISTS");

      customer = await db.user.create({
        data: { name, email, phone, role: "CUSTOMER", passwordHash: await bcrypt.hash(password, 10) },
      });
      await createSession(customer.id);
      accountCreated = true;
    }

    const products = await db.product.findMany({ where: { id: { in: [...wanted.keys()] }, isActive: true } });
    if (products.length !== wanted.size) return jsonError("Some items in your cart are no longer available", 409);

    const lines = products.map((p) => {
      const qty = wanted.get(p.id);
      const unitPrice = p.salePrice && p.salePrice < p.price ? p.salePrice : p.price;
      return { p, qty, unitPrice, total: unitPrice * qty };
    });
    const subtotal = lines.reduce((s, l) => s + l.total, 0);

    const orderNumber = `ORD-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${crypto.randomInt(10000, 99999)}`;
    const noteParts = [
      `Payment: ${PAYMENT_LABELS[payment]}`,
      customer ? null : `Guest: ${name}${email ? ` <${email}>` : ""}`,
      notes || null,
    ].filter(Boolean);

    const order = await db.$transaction(async (tx) => {
      for (const l of lines) {
        // atomic guard against overselling
        const res = await tx.product.updateMany({
          where: { id: l.p.id, stock: { gte: l.qty } },
          data: { stock: { decrement: l.qty } },
        });
        if (res.count === 0) throw new CheckoutError(`Not enough stock for "${l.p.name}"`);
      }

      const created = await tx.order.create({
        data: {
          orderNumber,
          customerId: customer?.id ?? null,
          subtotal,
          total: subtotal,
          phone,
          address: city ? `${address}, ${city}` : address,
          notes: noteParts.join(" | "),
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
      });

      for (const l of lines) {
        const after = await tx.product.findUnique({ where: { id: l.p.id }, select: { stock: true } });
        await tx.stockMovement.create({
          data: {
            productId: l.p.id,
            type: "SALE",
            quantity: -l.qty,
            balanceAfter: after?.stock ?? null,
            reference: orderNumber,
            notes: "Online order",
          },
        });
      }
      return created;
    });

    // remember the address for next time (after the order succeeded)
    if (customer && body.saveAddress) {
      try {
        const dup = await db.address.findFirst({ where: { userId: customer.id, address } });
        if (!dup) {
          const count = await db.address.count({ where: { userId: customer.id } });
          await db.address.create({
            data: { userId: customer.id, label: "Delivery", phone, address, city: city || null, isDefault: count === 0 },
          });
        }
      } catch (e) {
        console.error("[checkout] save address failed", e);
      }
    }

    return NextResponse.json(
      {
        data: { id: order.id, orderNumber: order.orderNumber, total: order.total, loggedIn: Boolean(customer), accountCreated },
        message: "Order placed successfully",
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof CheckoutError) return jsonError(err.message, err.status);
    console.error("[checkout]", err);
    return jsonError("We couldn't place your order. Please try again.", 500);
  }
}