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
        // Redirect based on role
        // Get session to determine role
        const response = await fetch("/api/auth/session");
        const session = await response.json();
        
        if (session?.user?.role === "PARENT") {
          router.push("/parent");
        } else if (session?.user?.role === "TEACHER") {
          router.push("/teacher");
        } else if (session?.user?.role === "STUDENT") {
          router.push("/student");
        } else {
          router.push("/admin");
        }
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

          {/* Quick Login Buttons for Testing */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-3 text-center">Quick Login (Testing)</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setEmail("parent1@engineercentral.edu");
                  setPassword("School@123");
                }}
                className="px-3 py-2 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition-colors"
              >
                👨‍👩‍👧 Parent
              </button>
              <button
                onClick={() => {
                  setEmail("admin@engineercentral.edu");
                  setPassword("School@123");
                }}
                className="px-3 py-2 text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg border border-purple-200 transition-colors"
              >
                👨‍💼 Admin
              </button>
              <button
                onClick={() => {
                  setEmail("teacher1@engineercentral.edu");
                  setPassword("School@123");
                }}
                className="px-3 py-2 text-xs bg-green-50 hover:bg-green-100 text-green-700 rounded-lg border border-green-200 transition-colors"
              >
                👨‍🏫 Teacher
              </button>
              <button
                onClick={() => {
                  setEmail("student1@engineercentral.edu");
                  setPassword("School@123");
                }}
                className="px-3 py-2 text-xs bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded-lg border border-yellow-200 transition-colors"
              >
                👨‍🎓 Student
              </button>
            </div>
          </div>

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