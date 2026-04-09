import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname.startsWith("/auth") || pathname.startsWith("/api");
  const protectedRoute = !isAuthRoute;
  const hasSession = request.cookies.get("sb-access-token") || request.cookies.get("sb:token");

  if (protectedRoute && !hasSession) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
