// src/components/frontend/AccountDashboard.jsx
// Route: n/a. Overview, order history, addresses and profile for a logged-in customer.
"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Loader2, LogOut, MapPin, Package, Pencil, Plus, Trash2, User } from "lucide-react";
import { formatUGX } from "@/context/CartContext";
import { useCustomer } from "@/context/CustomerContext";
import { api } from "@/lib/storefrontApi";

const PLACEHOLDER = "/images/placeholder.png";
const inputCls =
  "w-full rounded-md border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100";
const card = "rounded-xl bg-white p-5 shadow-sm sm:p-6";

const fmtDate = (v) =>
  v ? new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-";
const nice = (s) => String(s ?? "").replace(/_/g, " ").toLowerCase();

const STATUS_CLS = {
  PENDING: "bg-amber-100 text-amber-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-700",
};

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
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</div>
      <div className="mt-1 text-xl font-bold text-gray-900">{value}</div>
      {sub && <div className="text-xs text-gray-500">{sub}</div>}
    </div>
  );
}

/* ───────────── Orders ───────────── */
function OrderCard({ order }) {
  const [open, setOpen] = useState(false);
  const count = order.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left">
        <div>
          <div className="font-semibold text-gray-900">{order.orderNumber}</div>
          <div className="text-xs text-gray-500">{fmtDate(order.createdAt)} · {count} item{count === 1 ? "" : "s"}</div>
        </div>
        <div className="flex items-center gap-3">
          <Badge status={order.status} />
          <span className="font-semibold text-gray-900">{formatUGX(order.total)}</span>
          <ChevronDown size={16} className={`text-gray-400 transition ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {open && (
        <div className="space-y-4 border-t border-gray-100 p-4 text-sm">
          <ul className="divide-y divide-gray-100">
            {order.items.map((i) => (
              <li key={i.id} className="flex items-center gap-3 py-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={i.image || PLACEHOLDER}
                  alt=""
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = PLACEHOLDER; }}
                  className="h-12 w-12 shrink-0 rounded-md border border-gray-100 bg-white object-contain p-1"
                />
                <div className="min-w-0 flex-1">
                  {i.slug ? (
                    <Link href={`/product/${i.slug}`} className="line-clamp-1 font-medium text-gray-900 hover:text-blue-600">{i.name}</Link>
                  ) : (
                    <span className="line-clamp-1 font-medium text-gray-900">{i.name}</span>
                  )}
                  <div className="text-xs text-gray-500">{i.quantity} × {formatUGX(i.unitPrice)}</div>
                </div>
                <div className="font-medium text-gray-900">{formatUGX(i.total)}</div>
              </li>
            ))}
          </ul>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-xs font-semibold uppercase text-gray-500">Delivery</div>
              <p className="mt-1 text-gray-700">{order.address}</p>
              <p className="text-gray-500">{order.phone}</p>
              {order.notes && <p className="mt-1 text-xs text-gray-500">{order.notes}</p>}
            </div>
            <div>
              <div className="text-xs font-semibold uppercase text-gray-500">Invoices</div>
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

          <div className="ml-auto max-w-xs space-y-1 text-gray-700">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatUGX(order.subtotal)}</span></div>
            {order.discount > 0 && <div className="flex justify-between"><span>Discount</span><span>-{formatUGX(order.discount)}</span></div>}
            <div className="flex justify-between border-t border-gray-100 pt-1 font-bold text-gray-900"><span>Total</span><span>{formatUGX(order.total)}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────── Addresses ───────────── */
const EMPTY_ADDR = { label: "", phone: "", address: "", city: "", isDefault: false };

function Addresses({ addresses, defaultPhone, onChange }) {
  const [editing, setEditing] = useState(null); // null | "new" | address
  const [form, setForm] = useState(EMPTY_ADDR);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const openForm = (addr) => {
    setError("");
    setEditing(addr || "new");
    setForm(addr ? { label: addr.label || "", phone: addr.phone, address: addr.address, city: addr.city || "", isDefault: addr.isDefault } : { ...EMPTY_ADDR, phone: defaultPhone || "" });
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const isNew = editing === "new";
    const res = await api(isNew ? "/api/storefront/account/addresses" : `/api/storefront/account/addresses/${editing.id}`, {
      method: isNew ? "POST" : "PUT",
      body: form,
    });
    setBusy(false);
    if (!res.ok) return setError(res.message);
    setEditing(null);
    onChange();
  };

  const remove = async (a) => {
    if (!window.confirm("Delete this address?")) return;
    await api(`/api/storefront/account/addresses/${a.id}`, { method: "DELETE" });
    onChange();
  };

  const makeDefault = async (a) => {
    await api(`/api/storefront/account/addresses/${a.id}`, { method: "PUT", body: { isDefault: true } });
    onChange();
  };

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

      {editing && (
        <form onSubmit={save} className={`${card} grid gap-4 sm:grid-cols-2`}>
          <input className={inputCls} placeholder="Label (Home, Office...)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          <input className={inputCls} placeholder="Phone *" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input className={`${inputCls} sm:col-span-2`} placeholder="Street, building, shop no. *" required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <input className={inputCls} placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} /> Make default
          </label>
          {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
          <div className="flex justify-end gap-3 sm:col-span-2">
            <button type="button" onClick={() => setEditing(null)} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button disabled={busy} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              {busy && <Loader2 size={14} className="animate-spin" />} Save
            </button>
          </div>
        </form>
      )}

      {addresses.length === 0 && !editing ? (
        <p className={`${card} text-center text-sm text-gray-500`}>No saved addresses yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((a) => (
            <div key={a.id} className={card}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">{a.label || "Address"}</span>
                {a.isDefault && <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">Default</span>}
              </div>
              <p className="mt-2 text-sm text-gray-700">{a.address}{a.city ? `, ${a.city}` : ""}</p>
              <p className="text-sm text-gray-500">{a.phone}</p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm font-medium">
                <button onClick={() => openForm(a)} className="inline-flex items-center gap-1 text-blue-600 hover:underline"><Pencil size={14} /> Edit</button>
                {!a.isDefault && <button onClick={() => makeDefault(a)} className="text-gray-600 hover:underline">Set default</button>}
                <button onClick={() => remove(a)} className="inline-flex items-center gap-1 text-red-600 hover:underline"><Trash2 size={14} /> Delete</button>
              </div>
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
  const [form, setForm] = useState({ name: customer.name, phone: customer.phone || "", currentPassword: "", newPassword: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg({ type: "", text: "" });
    const body = { name: form.name, phone: form.phone };
    if (form.newPassword) {
      body.newPassword = form.newPassword;
      body.currentPassword = form.currentPassword;
    }
    const res = await api("/api/storefront/account", { method: "PUT", body });
    setBusy(false);
    if (!res.ok) return setMsg({ type: "error", text: res.message });
    setMsg({ type: "ok", text: "Profile updated" });
    setForm((f) => ({ ...f, currentPassword: "", newPassword: "" }));
    await refresh();
    onSaved();
  };

  return (
    <form onSubmit={save} className={`${card} max-w-xl space-y-4`}>
      <h3 className="text-lg font-bold text-gray-900">Profile</h3>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Full name</label>
        <input className={inputCls} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
        <input className={`${inputCls} bg-gray-50 text-gray-500`} value={customer.email} disabled />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Phone</label>
        <input className={inputCls} type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      </div>

      <div className="space-y-3 border-t border-gray-100 pt-4">
        <p className="text-sm font-semibold text-gray-900">Change password (optional)</p>
        <input className={inputCls} type="password" placeholder="Current password" autoComplete="current-password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} />
        <input className={inputCls} type="password" placeholder="New password (min 8 characters)" autoComplete="new-password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
      </div>

      {msg.text && <p className={`text-sm ${msg.type === "ok" ? "text-green-700" : "text-red-600"}`}>{msg.text}</p>}
      <button disabled={busy} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
        {busy && <Loader2 size={14} className="animate-spin" />} Save changes
      </button>
    </form>
  );
}

/* ───────────── Dashboard ───────────── */
const TABS = [
  ["overview", "Overview", User],
  ["orders", "My orders", Package],
  ["addresses", "Addresses", MapPin],
  ["profile", "Profile", User],
];

export default function AccountDashboard() {
  const router = useRouter();
  const params = useSearchParams();
  const { logout } = useCustomer();
  const [tab, setTab] = useState(TABS.some(([k]) => k === params.get("tab")) ? params.get("tab") : "overview");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await api("/api/storefront/account");
    if (res.ok) setData(res.data);
    else setError(res.message);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onLogout = async () => {
    await logout();
    router.push("/");
    router.refresh();
  };

  if (error) return <p className="py-10 text-center text-sm text-red-600">{error}</p>;
  if (!data) return <div className="flex justify-center py-20 text-gray-400"><Loader2 className="animate-spin" /></div>;

  const { customer, stats, addresses, orders } = data;
  const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hello, {customer.name.split(" ")[0]}</h1>
          <p className="text-sm text-gray-500">{customer.email}{customer.phone ? ` · ${customer.phone}` : ""} · Member since {fmtDate(customer.createdAt)}</p>
        </div>
        <button onClick={onLogout} className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
          <LogOut size={15} /> Logout
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-gray-200">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 pb-3 text-sm font-semibold ${
              tab === key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat title="Orders" value={stats.orderCount} sub={stats.lastOrderAt ? `Last ${fmtDate(stats.lastOrderAt)}` : "No orders yet"} />
            <Stat title="Total spent" value={formatUGX(stats.totalSpent)} />
            <Stat title="Saved addresses" value={addresses.length} />
            <Stat title="Open orders" value={orders.filter((o) => ["PENDING", "PROCESSING", "SHIPPED"].includes(o.status)).length} />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-3 lg:col-span-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Recent orders</h3>
                {orders.length > 3 && <button onClick={() => setTab("orders")} className="text-sm font-semibold text-blue-600 hover:underline">View all</button>}
              </div>
              {orders.length === 0 ? (
                <div className={`${card} text-center text-sm text-gray-500`}>
                  You haven't placed an order yet. <Link href="/products" className="font-semibold text-blue-600 hover:underline">Start shopping</Link>
                </div>
              ) : (
                orders.slice(0, 3).map((o) => <OrderCard key={o.id} order={o} />)
              )}
            </div>
            <div className={card}>
              <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">Default address</h3>
              {defaultAddress ? (
                <>
                  <p className="mt-2 text-sm text-gray-800">{defaultAddress.address}{defaultAddress.city ? `, ${defaultAddress.city}` : ""}</p>
                  <p className="text-sm text-gray-500">{defaultAddress.phone}</p>
                </>
              ) : (
                <p className="mt-2 text-sm text-gray-500">None saved yet.</p>
              )}
              <button onClick={() => setTab("addresses")} className="mt-3 text-sm font-semibold text-blue-600 hover:underline">Manage addresses</button>
            </div>
          </div>
        </div>
      )}

      {tab === "orders" && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-gray-900">Order history</h3>
          {orders.length === 0 ? (
            <div className={`${card} text-center text-sm text-gray-500`}>No orders yet.</div>
          ) : (
            orders.map((o) => <OrderCard key={o.id} order={o} />)
          )}
        </div>
      )}

      {tab === "addresses" && <Addresses addresses={addresses} defaultPhone={customer.phone} onChange={load} />}
      {tab === "profile" && <Profile customer={customer} onSaved={load} />}
    </div>
  );
}