// src/components/frontend/AccountDashboard.jsx
// Route: n/a. Overview, order history, addresses and profile for a logged-in customer.
// All data comes from GET /api/storefront/account (database-backed) and is reloaded after every change.
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  ChevronDown,
  LayoutDashboard,
  Loader2,
  LogOut,
  MapPin,
  Package,
  Pencil,
  Plus,
  Trash2,
  User,
} from "lucide-react";
import { formatUGX } from "@/context/CartContext";
import { useCustomer } from "@/context/CustomerContext";
import { api } from "@/lib/storefrontApi";

const PLACEHOLDER = "/images/placeholder.png";
const PAGE_SIZE = 10;
const inputBase =
  "w-full rounded-md border bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100";
const inputCls = `${inputBase} border-gray-300`;
const card = "rounded-xl bg-white p-5 shadow-sm sm:p-6";

const fmtDate = (v) =>
  v ? new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-";
const nice = (s) => String(s ?? "").replace(/_/g, " ").toLowerCase();

const OPEN_STATUSES = ["PENDING", "PROCESSING", "SHIPPED"];
const STATUS_CLS = {
  PENDING: "bg-amber-100 text-amber-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-700",
};
const TRACK = [
  ["PENDING", "Placed"],
  ["PROCESSING", "Processing"],
  ["SHIPPED", "Shipped"],
  ["COMPLETED", "Delivered"],
];

const TABS = [
  ["overview", "Overview", LayoutDashboard],
  ["orders", "My orders", Package],
  ["addresses", "Addresses", MapPin],
  ["profile", "Profile", User],
];
const TAB_KEYS = TABS.map(([k]) => k);

/* ───────────── Small pieces ───────────── */
function Badge({ status }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_CLS[status] || "bg-gray-100 text-gray-700"}`}>
      {nice(status)}
    </span>
  );
}

function Stat({ title, value, sub }) {
  return (
    <div className={card}>
      <div className="text-sm text-gray-500">{title}</div>
      <div className="mt-1 text-2xl font-bold text-gray-900">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-gray-500">{sub}</div>}
    </div>
  );
}

function Notice({ notice }) {
  if (!notice?.text) return null;
  const ok = notice.type === "ok";
  return (
    <p role={ok ? "status" : "alert"} className={`rounded-md px-3 py-2 text-sm ${ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
      {notice.text}
    </p>
  );
}

function Label({ htmlFor, children }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-gray-700">
      {children}
    </label>
  );
}

function Skeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="h-12 w-1/2 animate-pulse rounded-lg bg-gray-200" />
      <div className="h-10 animate-pulse rounded-lg bg-gray-200" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-200" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl bg-gray-200" />
    </div>
  );
}

/* ───────────── Orders ───────────── */
function OrderTracker({ status }) {
  if (status === "CANCELLED") {
    return <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">This order was cancelled.</p>;
  }
  const current = TRACK.findIndex(([k]) => k === status);
  return (
    <ol className="flex items-center" aria-label="Order progress">
      {TRACK.map(([key, label], i) => {
        const done = i <= current;
        return (
          <li key={key} className={`flex items-center ${i < TRACK.length - 1 ? "flex-1" : ""}`}>
            <span className="flex flex-col items-center gap-1">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-white ${done ? "bg-blue-600" : "bg-gray-200"}`}>
                {done && <Check size={13} />}
              </span>
              <span className={`text-xs ${done ? "font-medium text-gray-900" : "text-gray-400"}`}>{label}</span>
            </span>
            {i < TRACK.length - 1 && <span className={`mx-2 mb-5 h-0.5 flex-1 ${i < current ? "bg-blue-600" : "bg-gray-200"}`} />}
          </li>
        );
      })}
    </ol>
  );
}

function OrderCard({ order, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const count = order.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left"
      >
        <div>
          <div className="font-semibold text-gray-900">{order.orderNumber}</div>
          <div className="text-xs text-gray-500">
            Placed {fmtDate(order.createdAt)}, {count} item{count === 1 ? "" : "s"}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge status={order.status} />
          <span className="font-semibold text-gray-900">{formatUGX(order.total)}</span>
          <ChevronDown size={16} className={`text-gray-400 transition ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {open && (
        <div className="space-y-5 border-t border-gray-100 p-4 text-sm">
          <OrderTracker status={order.status} />

          <ul className="divide-y divide-gray-100">
            {order.items.map((i) => (
              <li key={i.id} className="flex items-center gap-3 py-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={i.image || PLACEHOLDER}
                  alt=""
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = PLACEHOLDER;
                  }}
                  className="h-12 w-12 shrink-0 rounded-md border border-gray-100 bg-white object-contain p-1"
                />
                <div className="min-w-0 flex-1">
                  {i.slug ? (
                    <Link href={`/product/${i.slug}`} className="line-clamp-1 font-medium text-gray-900 hover:text-blue-600">
                      {i.name}
                    </Link>
                  ) : (
                    <span className="line-clamp-1 font-medium text-gray-900">{i.name}</span>
                  )}
                  <div className="text-xs text-gray-500">
                    {i.quantity} × {formatUGX(i.unitPrice)}
                  </div>
                </div>
                <div className="font-medium text-gray-900">{formatUGX(i.total)}</div>
              </li>
            ))}
          </ul>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-sm font-semibold text-gray-900">Delivery</div>
              <p className="mt-1 text-gray-700">{order.address}</p>
              <p className="text-gray-500">{order.phone}</p>
              {order.notes && <p className="mt-1 text-xs text-gray-500">Note: {order.notes}</p>}
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">Invoices</div>
              {order.invoices.length === 0 ? (
                <p className="mt-1 text-gray-500">Not invoiced yet</p>
              ) : (
                order.invoices.map((inv) => (
                  <p key={inv.id} className="mt-1 text-gray-700">
                    {inv.number} <span className="text-xs capitalize text-gray-500">({nice(inv.status)})</span>
                    {inv.balance > 0 && <span className="ml-1 text-xs text-red-600">balance {formatUGX(inv.balance)}</span>}
                  </p>
                ))
              )}
            </div>
          </div>

          <dl className="ml-auto max-w-xs space-y-1 text-gray-700">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatUGX(order.subtotal)}</dd></div>
            {order.discount > 0 && (
              <div className="flex justify-between text-green-700"><dt>Discount</dt><dd>− {formatUGX(order.discount)}</dd></div>
            )}
            <div className="flex justify-between border-t border-gray-100 pt-1 font-bold text-gray-900">
              <dt>Total</dt><dd>{formatUGX(order.total)}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}

const FILTERS = [
  ["all", "All", () => true],
  ["open", "In progress", (o) => OPEN_STATUSES.includes(o.status)],
  ["completed", "Completed", (o) => o.status === "COMPLETED"],
  ["cancelled", "Cancelled", (o) => o.status === "CANCELLED"],
];

function Orders({ orders }) {
  const [filter, setFilter] = useState("all");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const counts = useMemo(
    () => Object.fromEntries(FILTERS.map(([k, , fn]) => [k, orders.filter(fn).length])),
    [orders]
  );
  const fn = FILTERS.find(([k]) => k === filter)[2];
  const list = orders.filter(fn);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900">Order history</h3>

      {orders.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setFilter(key);
                setVisible(PAGE_SIZE);
              }}
              aria-pressed={filter === key}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                filter === key
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {label} <span className={filter === key ? "text-blue-100" : "text-gray-400"}>{counts[key]}</span>
            </button>
          ))}
        </div>
      )}

      {orders.length === 0 ? (
        <div className={`${card} text-center`}>
          <p className="font-medium text-gray-900">No orders yet</p>
          <p className="mt-1 text-sm text-gray-500">When you place an order, you can follow it here.</p>
          <Link href="/products" className="mt-4 inline-block rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
            Start shopping
          </Link>
        </div>
      ) : list.length === 0 ? (
        <div className={`${card} text-center text-sm text-gray-500`}>No orders match this filter.</div>
      ) : (
        <>
          {list.slice(0, visible).map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
          {list.length > visible && (
            <button
              type="button"
              onClick={() => setVisible((v) => v + PAGE_SIZE)}
              className="w-full rounded-md border border-gray-300 bg-white py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Show more orders ({list.length - visible} remaining)
            </button>
          )}
        </>
      )}
    </div>
  );
}

/* ───────────── Addresses ───────────── */
const EMPTY_ADDR = { label: "", phone: "", address: "", city: "", isDefault: false };

function Addresses({ addresses, defaultPhone, onChange }) {
  const [editing, setEditing] = useState(null); // null | "new" | address
  const [form, setForm] = useState(EMPTY_ADDR);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [notice, setNotice] = useState(null);

  const openForm = (addr) => {
    setNotice(null);
    setErrors({});
    setConfirmId(null);
    setEditing(addr || "new");
    setForm(
      addr
        ? { label: addr.label || "", phone: addr.phone || "", address: addr.address || "", city: addr.city || "", isDefault: addr.isDefault }
        : { ...EMPTY_ADDR, phone: defaultPhone || "" }
    );
  };

  const save = async (e) => {
    e.preventDefault();
    if (busy) return;
    const errs = {};
    if (!form.phone.trim()) errs.phone = "Enter a phone number";
    if (!form.address.trim()) errs.address = "Enter the street, building or shop number";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    const isNew = editing === "new";
    const res = await api(isNew ? "/api/storefront/account/addresses" : `/api/storefront/account/addresses/${editing.id}`, {
      method: isNew ? "POST" : "PUT",
      body: form,
    });
    setBusy(false);
    if (!res.ok) return setNotice({ type: "error", text: res.message || "Could not save the address" });
    setEditing(null);
    setNotice({ type: "ok", text: isNew ? "Address added" : "Address updated" });
    onChange();
  };

  const remove = async (a) => {
    setConfirmId(null);
    const res = await api(`/api/storefront/account/addresses/${a.id}`, { method: "DELETE" });
    if (!res.ok) return setNotice({ type: "error", text: res.message || "Could not delete the address" });
    setNotice({ type: "ok", text: "Address deleted" });
    onChange();
  };

  const makeDefault = async (a) => {
    const res = await api(`/api/storefront/account/addresses/${a.id}`, { method: "PUT", body: { isDefault: true } });
    if (!res.ok) return setNotice({ type: "error", text: res.message || "Could not update the address" });
    setNotice({ type: "ok", text: "Default address updated" });
    onChange();
  };

  const border = (k) => (errors[k] ? "border-red-400" : "border-gray-300");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Delivery addresses</h3>
        {!editing && (
          <button onClick={() => openForm()} className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            <Plus size={15} /> Add address
          </button>
        )}
      </div>

      <Notice notice={notice} />

      {editing && (
        <form onSubmit={save} noValidate className={`${card} grid gap-4 sm:grid-cols-2`}>
          <h4 className="font-semibold text-gray-900 sm:col-span-2">{editing === "new" ? "New address" : "Edit address"}</h4>
          <div>
            <Label htmlFor="addr-label">Label (optional)</Label>
            <input id="addr-label" className={inputCls} placeholder="Home, Office…" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="addr-phone">Phone</Label>
            <input id="addr-phone" type="tel" className={`${inputBase} ${border("phone")}`} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="addr-address">Street, building or shop number</Label>
            <input id="addr-address" className={`${inputBase} ${border("address")}`} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address}</p>}
          </div>
          <div>
            <Label htmlFor="addr-city">City or town</Label>
            <input id="addr-city" className={inputCls} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 self-end pb-2.5 text-sm text-gray-700">
            <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
            Use as my default address
          </label>
          <div className="flex justify-end gap-3 sm:col-span-2">
            <button type="button" onClick={() => setEditing(null)} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button disabled={busy} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              {busy && <Loader2 size={14} className="animate-spin" />} Save address
            </button>
          </div>
        </form>
      )}

      {addresses.length === 0 && !editing ? (
        <div className={`${card} text-center`}>
          <p className="font-medium text-gray-900">No saved addresses</p>
          <p className="mt-1 text-sm text-gray-500">Save one and it will be ready at checkout.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((a) => (
            <div key={a.id} className={`${card} ${a.isDefault ? "ring-1 ring-blue-200" : ""}`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">{a.label || "Address"}</span>
                {a.isDefault && <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">Default</span>}
              </div>
              <p className="mt-2 text-sm text-gray-700">
                {a.address}
                {a.city ? `, ${a.city}` : ""}
              </p>
              <p className="text-sm text-gray-500">{a.phone}</p>

              {confirmId === a.id ? (
                <div className="mt-3 flex items-center gap-3 text-sm">
                  <span className="text-gray-700">Delete this address?</span>
                  <button onClick={() => remove(a)} className="font-semibold text-red-600 hover:underline">Delete</button>
                  <button onClick={() => setConfirmId(null)} className="text-gray-600 hover:underline">Keep</button>
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap gap-4 text-sm font-medium">
                  <button onClick={() => openForm(a)} className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                    <Pencil size={14} /> Edit
                  </button>
                  {!a.isDefault && (
                    <button onClick={() => makeDefault(a)} className="text-gray-600 hover:underline">Set as default</button>
                  )}
                  <button onClick={() => setConfirmId(a.id)} className="inline-flex items-center gap-1 text-red-600 hover:underline">
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────────── Profile ───────────── */
function Profile({ customer, onSaved }) {
  const { refresh } = useCustomer();
  const initial = { name: customer.name || "", phone: customer.phone || "", currentPassword: "", newPassword: "", confirm: "" };
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  const dirty = form.name !== initial.name || form.phone !== initial.phone || form.newPassword.length > 0;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    if (busy || !dirty) return;
    setNotice(null);

    if (!form.name.trim()) return setNotice({ type: "error", text: "Name is required" });
    if (form.newPassword) {
      if (form.newPassword.length < 8) return setNotice({ type: "error", text: "New password must be at least 8 characters" });
      if (form.newPassword !== form.confirm) return setNotice({ type: "error", text: "New passwords do not match" });
    }

    setBusy(true);
    const body = { name: form.name.trim(), phone: form.phone.trim() };
    if (form.newPassword) {
      body.newPassword = form.newPassword;
      body.currentPassword = form.currentPassword;
    }
    const res = await api("/api/storefront/account", { method: "PUT", body });
    setBusy(false);
    if (!res.ok) return setNotice({ type: "error", text: res.message || "Could not update your profile" });

    setNotice({ type: "ok", text: "Your profile has been updated" });
    setForm((f) => ({ ...f, currentPassword: "", newPassword: "", confirm: "" }));
    await refresh();
    onSaved();
  };

  return (
    <form onSubmit={save} noValidate className={`${card} max-w-xl space-y-4`}>
      <h3 className="text-lg font-bold text-gray-900">Profile</h3>
      <div>
        <Label htmlFor="pf-name">Full name</Label>
        <input id="pf-name" className={inputCls} autoComplete="name" value={form.name} onChange={set("name")} />
      </div>
      <div>
        <Label htmlFor="pf-email">Email</Label>
        <input id="pf-email" className={`${inputCls} bg-gray-50 text-gray-500`} value={customer.email || ""} disabled />
        <p className="mt-1 text-xs text-gray-500">Your email is used to sign in and can't be changed here.</p>
      </div>
      <div>
        <Label htmlFor="pf-phone">Phone</Label>
        <input id="pf-phone" className={inputCls} type="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} />
      </div>

      <div className="space-y-3 border-t border-gray-100 pt-4">
        <p className="text-sm font-semibold text-gray-900">Change password</p>
        <p className="text-xs text-gray-500">Leave these blank to keep your current password.</p>
        <input className={inputCls} type="password" aria-label="Current password" placeholder="Current password" autoComplete="current-password" value={form.currentPassword} onChange={set("currentPassword")} />
        <input className={inputCls} type="password" aria-label="New password" placeholder="New password (at least 8 characters)" autoComplete="new-password" value={form.newPassword} onChange={set("newPassword")} />
        {form.newPassword && (
          <input className={inputCls} type="password" aria-label="Confirm new password" placeholder="Confirm new password" autoComplete="new-password" value={form.confirm} onChange={set("confirm")} />
        )}
      </div>

      <Notice notice={notice} />
      <button
        disabled={busy || !dirty}
        className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {busy && <Loader2 size={14} className="animate-spin" />} Save changes
      </button>
    </form>
  );
}

/* ───────────── Dashboard ───────────── */
export default function AccountDashboard() {
  const router = useRouter();
  const params = useSearchParams();
  const { logout } = useCustomer();

  const urlTab = params.get("tab");
  const [tab, setTab] = useState(TAB_KEYS.includes(urlTab) ? urlTab : "overview");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  // header menu links change ?tab= while this page stays mounted
  useEffect(() => {
    setTab(TAB_KEYS.includes(urlTab) ? urlTab : "overview");
  }, [urlTab]);

  const changeTab = (key) => {
    setTab(key);
    router.replace(key === "overview" ? "/account" : `/account?tab=${key}`, { scroll: false });
  };

  const load = useCallback(async () => {
    const res = await api("/api/storefront/account");
    if (res.ok) {
      setData(res.data);
      setError("");
    } else {
      setError(res.message || "Failed to load your account");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onLogout = async () => {
    await logout();
    router.push("/");
    router.refresh();
  };

  if (!data && !error) return <Skeleton />;
  if (!data) {
    return (
      <div className={`${card} mx-auto max-w-md text-center`}>
        <p className="font-medium text-gray-900">We couldn't load your account</p>
        <p className="mt-1 text-sm text-red-600">{error}</p>
        <button onClick={() => { setError(""); load(); }} className="mt-4 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
          Try again
        </button>
      </div>
    );
  }

  const { customer, stats, addresses, orders } = data;
  const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0];
  const openOrders = orders.filter((o) => OPEN_STATUSES.includes(o.status));
  const firstName = (customer.name || "there").split(" ")[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
            {(customer.name || "?").charAt(0).toUpperCase()}
          </span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hello, {firstName}</h1>
            <p className="text-sm text-gray-500">
              {customer.email}
              {customer.phone ? `, ${customer.phone}` : ""}
              {customer.createdAt ? `. Member since ${fmtDate(customer.createdAt)}` : ""}
            </p>
          </div>
        </div>
        <button onClick={onLogout} className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
          <LogOut size={15} /> Sign out
        </button>
      </div>

      <div role="tablist" aria-label="Account sections" className="flex gap-1 overflow-x-auto border-b border-gray-200">
        {TABS.map(([key, label, Icon]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => changeTab(key)}
            className={`-mb-px inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 pb-3 text-sm font-semibold ${
              tab === key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat title="Orders" value={stats.orderCount} sub={stats.lastOrderAt ? `Last order ${fmtDate(stats.lastOrderAt)}` : "No orders yet"} />
            <Stat title="Total spent" value={formatUGX(stats.totalSpent)} sub="Cancelled orders excluded" />
            <Stat title="In progress" value={openOrders.length} sub={openOrders.length ? "On their way to you" : "Nothing pending"} />
            <Stat title="Saved addresses" value={addresses.length} />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-3 lg:col-span-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Recent orders</h3>
                {orders.length > 3 && (
                  <button onClick={() => changeTab("orders")} className="text-sm font-semibold text-blue-600 hover:underline">
                    View all orders
                  </button>
                )}
              </div>
              {orders.length === 0 ? (
                <div className={`${card} text-center text-sm text-gray-500`}>
                  You haven't placed an order yet.{" "}
                  <Link href="/products" className="font-semibold text-blue-600 hover:underline">Start shopping</Link>
                </div>
              ) : (
                orders.slice(0, 3).map((o, idx) => <OrderCard key={o.id} order={o} defaultOpen={idx === 0 && OPEN_STATUSES.includes(o.status)} />)
              )}
            </div>

            <div className={`${card} h-fit`}>
              <h3 className="text-base font-bold text-gray-900">Default address</h3>
              {defaultAddress ? (
                <>
                  <p className="mt-2 text-sm text-gray-800">
                    {defaultAddress.address}
                    {defaultAddress.city ? `, ${defaultAddress.city}` : ""}
                  </p>
                  <p className="text-sm text-gray-500">{defaultAddress.phone}</p>
                </>
              ) : (
                <p className="mt-2 text-sm text-gray-500">No address saved yet.</p>
              )}
              <button onClick={() => changeTab("addresses")} className="mt-3 text-sm font-semibold text-blue-600 hover:underline">
                {defaultAddress ? "Manage addresses" : "Add an address"}
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === "orders" && <Orders orders={orders} />}
      {tab === "addresses" && <Addresses addresses={addresses} defaultPhone={customer.phone} onChange={load} />}
      {tab === "profile" && <Profile customer={customer} onSaved={load} />}
    </div>
  );
}