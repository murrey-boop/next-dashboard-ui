import type { Metadata } from "next";
import { Inter } from "next/font/google";
// @ts-ignore - side-effect CSS import without type declarations; add a global d.ts for CSS modules to remove this ignore
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Engineer Central Schools - Management System",
  description: "Comprehensive School Management System for Engineer Central Schools",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
