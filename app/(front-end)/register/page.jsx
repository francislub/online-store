// app/(auth)/register/page.jsx
import AuthCard from "@/components/frontend/AuthCard";
import RegisterForm from "@/components/frontend/RegisterForm";

export const metadata = {
  title: "Create Account | Green Planet Computers",
};

export default function RegisterPage() {
  return (
    <AuthCard title="Create a new account" subtitle="Join Green Planet Computers today">
      <RegisterForm />
    </AuthCard>
  );
}