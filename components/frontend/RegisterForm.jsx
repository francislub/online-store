// components/frontend/RegisterForm.jsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { signIn } from "next-auth/react";
import SubmitButton from "../FormInputs/SubmitButton";
import AuthInput from "../FormInputs/AuthInput";

const STAFF_ROLES = [
  { value: "CASHIER", label: "Cashier" },
  { value: "SALES", label: "Sales" },
  { value: "STOREKEEPER", label: "Storekeeper" },
  { value: "ADMIN", label: "Administrator" },
];

export default function RegisterForm({ isAdmin = false }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [emailErr, setEmailErr] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues: { role: isAdmin ? "CASHIER" : "CUSTOMER" },
  });

  async function onSubmit(data) {
    setLoading(true);
    setEmailErr("");
    try {
      const { confirmPassword, ...rest } = data;
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...rest, role: isAdmin ? rest.role : "CUSTOMER" }),
      });
      const responseData = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setEmailErr("An account with this email already exists");
          toast.error("An account with this email already exists");
        } else {
          toast.error(responseData.message || "Oops, something went wrong");
        }
        return;
      }

      toast.success("Account created successfully");

      if (isAdmin) {
        reset();
        router.push("/admin/login");
        return;
      }

      const result = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });
      reset();
      router.push(result?.error ? "/login" : "/");
      router.refresh();
    } catch (error) {
      console.error("Network Error:", error);
      toast.error("Something went wrong, please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <AuthInput
        label="Full Name"
        name="name"
        register={register}
        errors={errors}
        autoComplete="name"
        placeholder="Green "
        rules={{ required: "Full name is required", minLength: { value: 2, message: "Name is too short" } }}
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
      {emailErr && <small className="-mt-2 block text-red-600">{emailErr}</small>}

      <AuthInput
        label="Phone Number (optional)"
        name="phone"
        type="tel"
        register={register}
        errors={errors}
        autoComplete="tel"
        placeholder="+256 700 000000"
        rules={{
          pattern: { value: /^[+0-9\s-]{9,15}$/, message: "Enter a valid phone number" },
        }}
      />

      {isAdmin && (
        <div>
          <label
            htmlFor="role"
            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
          >
            Staff Role
          </label>
          <select
            id="role"
            {...register("role", { required: "Select a role" })}
            className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-lime-600 focus:border-lime-600 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            {STAFF_ROLES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
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
        name="confirmPassword"
        type="password"
        register={register}
        errors={errors}
        autoComplete="new-password"
        placeholder="Repeat your password"
        rules={{
          required: "Please confirm your password",
          validate: (value) => value === getValues("password") || "Passwords do not match",
        }}
      />

      {isAdmin && (
        <AuthInput
          label="Admin Registration Key"
          name="adminKey"
          type="password"
          register={register}
          errors={errors}
          placeholder="Provided by the system owner"
          rules={{ required: "Registration key is required" }}
        />
      )}

      <SubmitButton
        isLoading={loading}
        buttonTitle={isAdmin ? "Register Staff Account" : "Register"}
        loadingButtonTitle="Creating, please wait..."
      />

      <div className="flex items-center">
        <div className="h-[1px] w-full bg-slate-300 dark:bg-slate-600"></div>
        <span className="mx-2 text-sm text-gray-500">or</span>
        <div className="h-[1px] w-full bg-slate-300 dark:bg-slate-600"></div>
      </div>

      <p className="text-center text-sm font-light text-gray-500 dark:text-gray-400">
        Already have an account?{" "}
        <Link
          href={isAdmin ? "/admin/login" : "/login"}
          className="font-medium text-lime-600 hover:underline dark:text-lime-500"
        >
          Login
        </Link>
      </p>
    </form>
  );
}