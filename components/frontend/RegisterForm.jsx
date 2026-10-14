// File: components/frontend/RegisterForm.jsx
// Used by /register and /admin/register

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { getSession, signIn } from "next-auth/react";

import SubmitButton from "../FormInputs/SubmitButton";
import AuthInput from "../FormInputs/AuthInput";

const STAFF_ROLES = [
  "ADMIN",
  "CASHIER",
  "SALES",
  "STOREKEEPER",
];

const DASHBOARD_URL = "/dashboard";

function getSafePath(url) {
  if (
    typeof url !== "string" ||
    !url.startsWith("/") ||
    url.startsWith("//")
  ) {
    return null;
  }

  return url;
}

function getCallbackUrl() {
  if (typeof window === "undefined") {
    return null;
  }

  const params = new URLSearchParams(
    window.location.search
  );

  return getSafePath(params.get("callbackUrl"));
}

export default function RegisterForm({
  isAdmin = false,
}) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm();

  const loginHref = isAdmin
    ? "/admin/login"
    : "/login";

  async function onSubmit(values) {
    setLoading(true);

    try {
      const payload = {
        name: values.name,
        email: values.email,
        phone: values.phone,
        password: values.password,
      };

      // The server validates the registration key
      // and assigns the appropriate role.
      if (isAdmin) {
        payload.registrationKey =
          values.registrationKey;
      }

      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        toast.error(
          json?.message ||
            json?.error ||
            "Could not create your account"
        );

        return;
      }

      // Sign in automatically after registration.
      const result = await signIn("credentials", {
        redirect: false,
        email: values.email,
        password: values.password,
      });

      if (result?.error) {
        toast.success(
          "Account created. Please sign in."
        );

        router.push(loginHref);
        return;
      }

      // Retrieve the authenticated user's session.
      const session = await getSession();

      const userRole = session?.user?.role;

      const isStaff =
        typeof userRole === "string" &&
        STAFF_ROLES.includes(userRole);

      // Read callbackUrl without useSearchParams().
      const callback = getCallbackUrl();

      let destination;

      if (isStaff) {
        // Staff can only use the dashboard or a
        // destination inside the dashboard.
        destination =
          callback &&
          (callback === DASHBOARD_URL ||
            callback.startsWith(
              `${DASHBOARD_URL}/`
            ))
            ? callback
            : DASHBOARD_URL;
      } else {
        // Customers return to their requested
        // destination, or the storefront homepage.
        destination = callback || "/";
      }

      toast.success(
        "Account created, welcome!"
      );

      router.push(destination);
      router.refresh();
    } catch (error) {
      console.error(
        "Register Error:",
        error
      );

      toast.error(
        "Network error, please try again"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-3"
    >
      <AuthInput
        label="Full Name"
        name="name"
        type="text"
        register={register}
        errors={errors}
        autoComplete="name"
        placeholder="Your full name"
        rules={{
          required: "Full name is required",
        }}
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
          pattern: {
            value: /^\S+@\S+\.\S+$/,
            message:
              "Enter a valid email address",
          },
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
          rules={{
            required:
              "Registration key is required",
          }}
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
          minLength: {
            value: 8,
            message:
              "Password must be at least 8 characters",
          },
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
          required:
            "Please confirm your password",
          validate: (value) =>
            value === getValues("password") ||
            "Passwords do not match",
        }}
      />

      <SubmitButton
        isLoading={loading}
        buttonTitle={
          isAdmin
            ? "Create staff account"
            : "Create account"
        }
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