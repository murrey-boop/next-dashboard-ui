"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error(result.error);
      } else if (result?.ok) {
        toast.success("Welcome back!");
        router.push("/admin"); // Will redirect based on role later
        router.refresh();
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-lamaSkyLight via-lamaPurplleLight to-lamaYellowLight p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 space-y-6">
          {/* Logo and Title */}
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <Image
                src="/logo.png"
                alt="Engineer Central Schools"
                width={80}
                height={80}
                className="rounded-full"
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">
              Engineer Central Schools
            </h1>
            <p className="text-gray-500">Sign in to your account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-gray-700 block"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-lamaPurple focus:border-transparent outline-none transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-700 block"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-lamaPurple focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-lamaPurple to-lamaSky hover:from-lamaPurple/90 hover:to-lamaSky/90 text-gray-800 font-semibold py-3 rounded-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500">
            <p>
              Forgot your password?{" "}
              <button className="text-lamaPurple hover:underline font-medium">
                Contact Admin
              </button>
            </p>
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-white/80 backdrop-blur rounded-2xl p-4 text-center">
          <p className="text-xs text-gray-600">
            Default Password: <span className="font-mono font-bold">School@123</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Please change your password after first login
          </p>
        </div>
      </div>
    </div>
  );
}