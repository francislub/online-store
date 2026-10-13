// src/app/(frontend)/account/page.jsx
// Route: /account   (?tab=orders|addresses|profile|register)
import React, { Suspense } from "react";
import AccountView from "@/components/frontend/AccountView";

export const metadata = { title: "My Account" };

export default function AccountPage() {
  return (
    <section className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6">
      <Suspense fallback={null}>
        <AccountView />
      </Suspense>
    </section>
  );
}