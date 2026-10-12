// src/app/(back-office)/dashboard/banners/page.jsx
// Route: /dashboard/banners
import React from "react";
import PageHeader from "@/components/backoffice/PageHeader";
import BannerList from "@/components/backoffice/BannerList";

export default function Banner() {
  return (
    <div>
      <PageHeader heading="Banners" href="/dashboard/banners/new" linkTitle="Add Banner" />
      <BannerList />
    </div>
  );
}