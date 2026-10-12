// components/FormInputs/AuthInput.jsx
"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function AuthInput({
  label,
  name,
  register,
  errors,
  type = "text",
  rules = {},
  placeholder,
  autoComplete,
  className = "",
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && show ? "text" : type;
  const hasError = Boolean(errors?.[name]);

  return (
    <div className={className}>
      <label
        htmlFor={name}
        className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={name}
          type={inputType}
          placeholder={placeholder}
          autoComplete={autoComplete}
          {...register(name, rules)}
          className={`block w-full rounded-lg border bg-gray-50 p-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-lime-600 focus:border-lime-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 ${
            hasError
              ? "border-red-500 dark:border-red-500"
              : "border-gray-300 dark:border-gray-600"
          } ${isPassword ? "pr-10" : ""}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((prev) => !prev)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-lime-600"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {hasError && (
        <small className="mt-1 block text-red-600">{errors[name].message}</small>
      )}
    </div>
  );
}