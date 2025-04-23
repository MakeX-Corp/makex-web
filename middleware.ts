import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protected routes
  const protectedRoutes = ["/dashboard", "/ai-editor", "/profile"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    req.nextUrl.pathname.startsWith(route)
  );

  if (isProtectedRoute && !session) {
    // Redirect to login if accessing protected route without session
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Redirect to dashboard if logged in user tries to access login page
  if (
    session &&
    (req.nextUrl.pathname === "/login" ||
      req.nextUrl.pathname === "/signup" ||
      req.nextUrl.pathname === "/")
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return res;
}
