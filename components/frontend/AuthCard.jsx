// components/frontend/AuthCard.jsx
import Image from "next/image";
import Link from "next/link";

export default function AuthCard({ title, subtitle, badge, children }) {
  return (
    <section className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto flex min-h-screen flex-col items-center justify-center px-6 py-8">
        <Link
          href="/"
          className="mb-6 flex items-center text-2xl font-semibold text-gray-900 dark:text-white"
        >
          <Image
            src="/images/logo.jpeg"
            alt="Green Planet Computers"
            width={40}
            height={40}
            className="mr-3 h-10 w-10 rounded-full object-cover"
          />
          Green Planet Computers
        </Link>
        <div className="w-full rounded-lg bg-white shadow-2xl dark:border dark:border-gray-700 dark:bg-gray-800 sm:max-w-md">
          <div className="space-y-4 p-6 sm:p-8 md:space-y-6">
            {badge && (
              <span className="mx-auto block w-fit rounded-full bg-lime-100 px-3 py-1 text-xs font-semibold text-lime-800">
                {badge}
              </span>
            )}
            <div className="text-center">
              <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white md:text-2xl">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {subtitle}
                </p>
              )}
            </div>
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}