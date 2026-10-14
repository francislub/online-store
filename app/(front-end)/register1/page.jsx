// app/(auth)/register/page.jsx
// Route: /register
import { Suspense } from "react";
import AuthCard from "@/components/frontend/AuthCard";
import RegisterForm from "@/components/frontend/RegisterForm";

export const metadata = { title: "Create account | Green Planet Computers" };

export default function RegisterPage() {
  return (
    <AuthCard title="Create your account" subtitle="Order faster and track your purchases">
      <Suspense fallback={null}>
        <RegisterForm />
      </Suspense>
    </AuthCard>
  );
}