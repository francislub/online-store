// components/frontend/RegisterForm.jsx
// Used by /register (customers) and /admin/register (staff, needs a registration key)
"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { getSession, signIn } from "next-auth/react";
import SubmitButton from "../FormInputs/SubmitButton";
import AuthInput from "../FormInputs/AuthInput";

const STAFF_ROLES = ["ADMIN", "CASHIER", "SALES", "STOREKEEPER"];
const DASHBOARD_URL = "/dashboard";

function getSafePath(url) {
  return url && url.startsWith("/") && !url.startsWith("//") ? url : null;
}

export default function RegisterForm({ isAdmin = false }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm();

  const loginHref = isAdmin ? "/admin/login" : "/login";

  async function onSubmit(values) {
    setLoading(true);
    try {
      const payload = {
        name: values.name,
        email: values.email,
        phone: values.phone,
        password: values.password,
      };

      // The server validates the key and assigns the role. Never send a role from the client.
      if (isAdmin) payload.registrationKey = values.registrationKey;

      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(json?.message || json?.error || "Could not create your account");
        return;
      }

      // Sign in straight away
      const result = await signIn("credentials", {
        redirect: false,
        email: values.email,
        password: values.password,
      });

      if (result?.error) {
        toast.success("Account created. Please sign in.");
        router.push(loginHref);
        return;
      }

      const session = await getSession();
      const isStaff = STAFF_ROLES.includes(session?.user?.role);
      const callback = getSafePath(searchParams.get("callbackUrl"));

      let destination;
      if (isStaff) {
        destination =
          callback && callback.startsWith(DASHBOARD_URL) ? callback : DASHBOARD_URL;
      } else {
        destination = callback || "/";
      }

      toast.success("Account created, welcome!");
      router.push(destination);
      router.refresh();
    } catch (error) {
      console.error("Register Error:", error);
      toast.error("Network error, please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <AuthInput
        label="Full Name"
        name="name"
        type="text"
        register={register}
        errors={errors}
        autoComplete="name"
        placeholder="Your full name"
        rules={{ required: "Full name is required" }}
      />

      <AuthInput
        label="Email Address"
        name="email"
        type="email"
        register={register}
        errors={errors}
        autoComplete="email"
        placeholder="name@example.com"
        rules={{
          required: "Email is required",
          pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email address" },
        }}
      />

      <AuthInput
        label="Phone Number"
        name="phone"
        type="tel"
        register={register}
        errors={errors}
        autoComplete="tel"
        placeholder="Phone number (optional)"
        rules={{}}
      />

      {isAdmin && (
        <AuthInput
          label="Registration Key"
          name="registrationKey"
          type="password"
          register={register}
          errors={errors}
          autoComplete="off"
          placeholder="Enter the staff registration key"
          rules={{ required: "Registration key is required" }}
        />
      )}

      <AuthInput
        label="Password"
        name="password"
        type="password"
        register={register}
        errors={errors}
        autoComplete="new-password"
        placeholder="At least 8 characters"
        rules={{
          required: "Password is required",
          minLength: { value: 8, message: "Password must be at least 8 characters" },
        }}
      />

      <AuthInput
        label="Confirm Password"
        name="confirm"
        type="password"
        register={register}
        errors={errors}
        autoComplete="new-password"
        placeholder="Re-enter your password"
        rules={{
          required: "Please confirm your password",
          validate: (value) => value === getValues("password") || "Passwords do not match",
        }}
      />

      <SubmitButton
        isLoading={loading}
        buttonTitle={isAdmin ? "Create staff account" : "Create account"}
        loadingButtonTitle="Creating account, please wait..."
      />

      <p className="text-center text-sm font-light text-gray-500 dark:text-gray-400">
        Already have an account?{" "}
        <Link
          href={loginHref}
          className="font-medium text-lime-600 hover:underline dark:text-lime-500"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}