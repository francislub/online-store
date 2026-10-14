// app/(auth)/login/page.jsx
import { Suspense } from "react";
import AuthCard from "@/components/frontend/AuthCard";
import LoginForm from "@/components/frontend/LoginForm";

export const metadata = {
  title: "Login | Green Planet Computers",
};

export default function LoginPage() {
  return (
    <AuthCard title="Sign in to your account" subtitle="Welcome back to Green Planet Computers">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}