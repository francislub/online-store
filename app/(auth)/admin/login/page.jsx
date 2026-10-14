// app/(auth)/admin/login/page.jsx
import { Suspense } from "react";
import AuthCard from "@/components/frontend/AuthCard";
import LoginForm from "@/components/frontend/LoginForm";

export const metadata = {
  title: "Staff Login | Green Planet Computers",
};

export default function AdminLoginPage() {
  return (
    <AuthCard
      badge="Staff Portal"
      title="Sign in to the dashboard"
      subtitle="Manage orders, inventory and sales"
    >
      <Suspense fallback={null}>
        <LoginForm isAdmin />
      </Suspense>
    </AuthCard>
  );
}