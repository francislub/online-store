// src/components/NotificationBell.jsx
// Envelope (or bell) with unread badge + inbox dropdown + pop-up toasts.
//   dashboard : <NotificationBell mode="staff" tone="dashboard" viewAllHref="/dashboard/notifications" />
//   website   : <CustomerNotificationBell />
// Pass icon="bell" if you prefer a bell instead of the envelope.
"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, BellRing, CheckCheck, Mail, MailOpen, Send, Trash2, Volume2, VolumeX, X } from "lucide-react";
import useNotifications from "@/hooks/useNotifications";
import { CATEGORIES } from "@/lib/activityConfig";
import { CUSTOMER_HREFS } from "@/lib/customerEvents";
import { timeAgo } from "@/lib/timeAgo";

const TOAST_MS = 7000;

// one accent per category (full class names so Tailwind keeps them)
const TONES = {
  ORDER: { bar: "bg-blue-500", icon: "text-blue-600", soft: "bg-blue-100 text-blue-700" },
  PAYMENT: { bar: "bg-emerald-500", icon: "text-emerald-600", soft: "bg-emerald-100 text-emerald-700" },
  INVOICE: { bar: "bg-amber-500", icon: "text-amber-600", soft: "bg-amber-100 text-amber-700" },
  QUOTE: { bar: "bg-violet-500", icon: "text-violet-600", soft: "bg-violet-100 text-violet-700" },
  RETURN: { bar: "bg-rose-500", icon: "text-rose-600", soft: "bg-rose-100 text-rose-700" },
  PURCHASE: { bar: "bg-indigo-500", icon: "text-indigo-600", soft: "bg-indigo-100 text-indigo-700" },
  STOCK: { bar: "bg-orange-500", icon: "text-orange-600", soft: "bg-orange-100 text-orange-700" },
  EXPENSE: { bar: "bg-slate-500", icon: "text-slate-600", soft: "bg-slate-200 text-slate-700" },
  CATALOG: { bar: "bg-cyan-500", icon: "text-cyan-600", soft: "bg-cyan-100 text-cyan-700" },
  MARKETING: { bar: "bg-pink-500", icon: "text-pink-600", soft: "bg-pink-100 text-pink-700" },
  USER: { bar: "bg-teal-500", icon: "text-teal-600", soft: "bg-teal-100 text-teal-700" },
  ACCOUNT: { bar: "bg-lime-500", icon: "text-lime-600", soft: "bg-lime-100 text-lime-700" },
  SHOPPING: { bar: "bg-sky-500", icon: "text-sky-600", soft: "bg-sky-100 text-sky-700" },
  SYSTEM: { bar: "bg-gray-500", icon: "text-gray-600", soft: "bg-gray-200 text-gray-700" },
};
const tone = (type) => TONES[type] ?? TONES.ACCOUNT;

function ToastCard({ toast, href, onClose }) {
  const t = tone(toast.type);
  const label = CATEGORIES[toast.type]?.label;
  const body = (
    <>
      <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${t.soft}`}>
        <Mail size={17} />
      </span>
      <span className="min-w-0 flex-1 pr-5">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-gray-900 dark:text-white">{toast.title}</span>
          {label && <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${t.soft}`}>{label}</span>}
        </span>
        <span className="mt-0.5 block text-[13px] leading-snug text-gray-600 dark:text-slate-300">{toast.message}</span>
      </span>
    </>
  );
  return (
    <div
      className="group pointer-events-auto relative overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl ring-1 ring-black/5 dark:border-slate-700 dark:bg-slate-800"
      style={{ animation: "toastIn .3s ease-out" }}
    >
      <span className={`absolute inset-y-0 left-0 w-1 ${t.bar}`} />
      {href ? (
        <Link href={href} onClick={onClose} className="flex gap-3 py-3 pl-4 pr-3">
          {body}
        </Link>
      ) : (
        <div className="flex gap-3 py-3 pl-4 pr-3">{body}</div>
      )}
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss"
        className="absolute right-2 top-2 text-gray-400 hover:text-gray-700 dark:hover:text-white"
      >
        <X size={14} />
      </button>
      {/* countdown bar: pauses while the mouse is over the pop-up, closes it when it ends */}
      <span
        onAnimationEnd={onClose}
        className={`absolute bottom-0 left-0 h-0.5 w-full ${t.bar} group-hover:[animation-play-state:paused]`}
        style={{
          animationName: "toastBar",
          animationDuration: `${TOAST_MS}ms`,
          animationTimingFunction: "linear",
          animationFillMode: "forwards",
        }}
      />
    </div>
  );
}

export default function NotificationBell({
  mode = "staff",
  tone: look = mode === "staff" ? "dashboard" : "site",
  icon = "mail",
  enabled = true,
  viewAllHref,
  endpoint = "/api/notifications",
}) {
  const { items, unreadCount, toasts, dismissToast, markRead, clearAll, sendTest, soundEnabled, setSoundEnabled } =
    useNotifications({ endpoint, enabled });
  const [open, setOpen] = useState(false);
  const [perm, setPerm] = useState("unsupported");
  const ref = useRef(null);

  useEffect(() => {
    if (typeof Notification !== "undefined") setPerm(Notification.permission);
  }, []);

  useEffect(() => {
    const out = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", out);
    return () => document.removeEventListener("mousedown", out);
  }, []);

  const hrefFor = (type) =>
    mode === "customer" ? (type ? CUSTOMER_HREFS[type] ?? "/account" : undefined) : CATEGORIES[type]?.href;

  const unread = unreadCount > 0;
  const size = look === "dashboard" ? 20 : 17;
  const MainIcon = icon === "bell" ? (unread ? BellRing : Bell) : Mail;

  const askDesktop = async () => {
    try {
      setPerm(await Notification.requestPermission());
    } catch (error) {}
  };

  return (
    <>
      <style>{`
        @keyframes toastIn{from{opacity:0;transform:translateX(28px)}to{opacity:1;transform:translateX(0)}}
        @keyframes toastBar{from{width:100%}to{width:0}}
      `}</style>

      {/* POP-UPS */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 top-[72px] z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2"
      >
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} href={hrefFor(t.type)} onClose={() => dismissToast(t.id)} />
        ))}
      </div>

      {enabled && (
        <div ref={ref} className="relative">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label="Notifications"
            aria-expanded={open}
            className={`relative flex items-center justify-center transition ${
              look === "dashboard"
                ? `rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-700 ${
                    unread
                      ? "bg-lime-50 text-lime-600 dark:bg-lime-500/15 dark:text-lime-400"
                      : "text-slate-400"
                  }`
                : `h-10 w-10 rounded-full bg-white hover:scale-105 hover:bg-gray-100 ${
                    unread ? "text-lime-700" : "text-gray-400"
                  }`
            }`}
          >
            <MainIcon size={size} className={unread ? "animate-pulse" : ""} />
            {/* always visible: red number when there is mail, grey 0 when there is none */}
            <span
              className={`absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                unread ? "bg-red-600 text-white" : "bg-slate-200 text-slate-500 dark:bg-slate-600 dark:text-slate-300"
              }`}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          </button>

          {open && (
            <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-gray-100 bg-white text-gray-800 shadow-xl dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 sm:w-96">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-slate-700">
                <p className="text-sm font-semibold">
                  Inbox{" "}
                  <span className={`ml-1 text-xs font-medium ${unread ? "text-red-600" : "text-gray-400"}`}>
                    ({unreadCount})
                  </span>
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    title={soundEnabled ? "Mute sound" : "Turn sound on"}
                    className="text-gray-500 hover:text-lime-700"
                  >
                    {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                  </button>
                  <button
                    type="button"
                    disabled={!unread}
                    onClick={() => markRead({ all: true })}
                    className="flex items-center gap-1 text-xs font-medium text-lime-700 hover:underline disabled:opacity-40"
                  >
                    <CheckCheck size={14} /> Mark read
                  </button>
                  <button
                    type="button"
                    disabled={items.length === 0}
                    onClick={() => {
                      if (window.confirm("Clear all notifications? This empties your inbox and sets the count to 0.")) clearAll();
                    }}
                    className="flex items-center gap-1 text-xs font-medium text-red-600 hover:underline disabled:opacity-40"
                  >
                    <Trash2 size={14} /> Clear all
                  </button>
                </div>
              </div>

              {perm === "default" && (
                <button
                  type="button"
                  onClick={askDesktop}
                  className="w-full border-b border-gray-100 bg-lime-50 px-4 py-2 text-left text-xs font-medium text-lime-800 hover:bg-lime-100 dark:border-slate-700 dark:bg-lime-500/10 dark:text-lime-300"
                >
                  Turn on desktop alerts so you are told even when this tab is in the background
                </button>
              )}

              <ul className="max-h-96 overflow-y-auto">
                {items.length === 0 && (
                  <li className="flex flex-col items-center gap-2 p-8 text-sm text-gray-500">
                    <MailOpen size={26} className="text-gray-300" />
                    Your inbox is empty
                  </li>
                )}
                {items.map((n) => {
                  const isNew = !n.readAt;
                  const t = tone(n.type);
                  const href = hrefFor(n.type);
                  const EnvIcon = isNew ? Mail : MailOpen;
                  const inner = (
                    <>
                      <span
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          isNew ? t.soft : "bg-gray-100 text-gray-400 dark:bg-slate-700"
                        }`}
                      >
                        <EnvIcon size={15} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className={`truncate text-sm ${isNew ? "font-semibold" : "font-medium"}`}>{n.title}</span>
                          {isNew && <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />}
                        </span>
                        <span className="block text-[13px] text-gray-600 dark:text-slate-300">{n.message}</span>
                        <span className="mt-0.5 flex items-center gap-2 text-[11px] text-gray-400">
                          {CATEGORIES[n.type]?.label && (
                            <span className={`rounded-full px-1.5 py-px font-medium ${t.soft}`}>{CATEGORIES[n.type].label}</span>
                          )}
                          {timeAgo(n.createdAt)}
                        </span>
                      </span>
                    </>
                  );
                  const cls = `flex w-full gap-3 border-b border-gray-50 px-4 py-3 text-left hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-700/50 ${
                    isNew ? "bg-lime-50/60 dark:bg-slate-700/40" : ""
                  }`;
                  const onClick = () => {
                    if (isNew) markRead({ ids: [n.id] });
                    setOpen(false);
                  };
                  return (
                    <li key={n.id}>
                      {href ? (
                        <Link href={href} onClick={onClick} className={cls}>
                          {inner}
                        </Link>
                      ) : (
                        <button type="button" onClick={onClick} className={cls}>
                          {inner}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>

              <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2.5 dark:border-slate-700">
                {viewAllHref ? (
                  <Link
                    href={viewAllHref}
                    onClick={() => setOpen(false)}
                    className="text-xs font-semibold text-lime-700 hover:underline"
                  >
                    View all notifications
                  </Link>
                ) : (
                  <span />
                )}
                {mode === "staff" && (
                  <button
                    type="button"
                    onClick={() => sendTest("ORDER")}
                    className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-lime-700"
                    title="Creates a test order notification for you"
                  >
                    <Send size={12} /> Send test
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}