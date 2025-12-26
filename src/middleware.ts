import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Role-based route protection
    const role = token?.role?.toLowerCase();

    // Protect admin routes
    if (path.startsWith("/admin") && role !== "admin") {
      return NextResponse.redirect(new URL(`/${role || "sign-in"}`, req.url));
    }

    // Protect teacher routes
    if (path.startsWith("/teacher") && role !== "teacher") {
      return NextResponse.redirect(new URL(`/${role || "sign-in"}`, req.url));
    }

    // Protect parent routes
    if (path.startsWith("/parent") && role !== "parent") {
      return NextResponse.redirect(new URL(`/${role || "sign-in"}`, req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

// Protect all dashboard routes 
export const config = {
  matcher: ["/admin/:path*", "/teacher/:path*", "/parent/:path*"],
};
