// components/frontend/LoginForm.jsx
"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { getSession, signIn, signOut } from "next-auth/react";
import SubmitButton from "../FormInputs/SubmitButton";
import AuthInput from "../FormInputs/AuthInput";

const STAFF_ROLES = ["ADMIN", "CASHIER", "SALES", "STOREKEEPER"];

export default function LoginForm({ isAdmin = false }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  async function onSubmit({ email, password }) {
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        toast.error(
          result.error === "CredentialsSignin"
            ? "Invalid email or password"
            : result.error
        );
        return;
      }

      const session = await getSession();
      const isStaff = STAFF_ROLES.includes(session?.user?.role);

      if (isAdmin && !isStaff) {
        await signOut({ redirect: false });
        toast.error("This account does not have staff access");
        return;
      }

      const callbackUrl = searchParams.get("callbackUrl");
      const safeCallback =
        callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
          ? callbackUrl
          : null;

      toast.success("Welcome back");
      router.push(safeCallback || (isStaff ? "/dashboard" : "/"));
      router.refresh();
    } catch (error) {
      console.error("Login Error:", error);
      toast.error("Something went wrong, please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
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
        label="Password"
        name="password"
        type="password"
        register={register}
        errors={errors}
        autoComplete="current-password"
        placeholder="Enter your password"
        rules={{ required: "Password is required" }}
      />

      <SubmitButton
        isLoading={loading}
        buttonTitle="Login"
        loadingButtonTitle="Signing in, please wait..."
      />

      <div className="flex items-center">
        <div className="h-[1px] w-full bg-slate-300 dark:bg-slate-600"></div>
        <span className="mx-2 text-sm text-gray-500">or</span>
        <div className="h-[1px] w-full bg-slate-300 dark:bg-slate-600"></div>
      </div>

      {isAdmin ? (
        <div className="space-y-1 text-center text-sm font-light text-gray-500 dark:text-gray-400">
          <p>
            New staff member?{" "}
            <Link
              href="/admin/register"
              className="font-medium text-lime-600 hover:underline dark:text-lime-500"
            >
              Register
            </Link>
          </p>
          <p>
            <Link
              href="/"
              className="font-medium text-lime-600 hover:underline dark:text-lime-500"
            >
              Back to the online store
            </Link>
          </p>
        </div>
      ) : (
        <p className="text-center text-sm font-light text-gray-500 dark:text-gray-400">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-lime-600 hover:underline dark:text-lime-500"
          >
            Register
          </Link>
        </p>
      )}
    </form>
  );
}