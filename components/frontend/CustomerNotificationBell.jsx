// src/components/frontend/CustomerNotificationBell.jsx
// Drop-in for SiteHeader. The bell only shows when a customer is signed in,
// but pop-ups (e.g. "added to cart") still appear for guests.
"use client";

import React from "react";
import NotificationBell from "@/components/NotificationBell";
import { useCustomer } from "@/context/CustomerContext";

export default function CustomerNotificationBell() {
  const { customer } = useCustomer();
  return <NotificationBell mode="customer" enabled={!!customer} />;
}