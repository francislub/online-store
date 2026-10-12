// src/app/(back-office)/dashboard/banners/new/page.jsx
// Route: /dashboard/banners/new
import React from "react";
import BannerForm from "@/components/backoffice/BannerForm";

export default function NewBanner() {
  return <BannerForm mode="create" />;
}