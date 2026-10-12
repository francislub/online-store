// src/app/(frontend)/account/page.jsx
import React from "react";
import SiteShell from "@/components/frontend/SiteShell";
import PageBanner from "@/components/frontend/PageBanner";
import AccountForms from "@/components/frontend/AccountForms";

export const metadata = { title: "My Account" };

export default function AccountPage() {
  return (
    <SiteShell>
      <PageBanner title="My Account" subtitle="Log in or create an account to track your orders." />
      <section className="px-4 py-10 sm:px-6">
        <AccountForms />
      </section>
    </SiteShell>
  );
}
