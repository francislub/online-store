// app/(auth)/admin/register/page.jsx
import AuthCard from "@/components/frontend/AuthCard";
import RegisterForm from "@/components/frontend/RegisterForm";

export const metadata = {
  title: "Staff Registration | Green Planet Computers",
};

export default function AdminRegisterPage() {
  return (
    <AuthCard
      badge="Staff Portal"
      title="Create a staff account"
      subtitle="A registration key is required to create staff accounts"
    >
      <RegisterForm isAdmin />
    </AuthCard>
  );
}