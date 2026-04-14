import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isStaticAsset = pathname.includes(".") || pathname.startsWith("/_next");
  const isAuthRoute = pathname.startsWith("/auth") || pathname.startsWith("/api");

  if (isStaticAsset || isAuthRoute) {
    return NextResponse.next({ request });
  }

  // updateSession refreshes the session cookie AND returns the user —
  // one single getUser() call instead of two.
  const { response, user } = await updateSession(request);

  if (!user) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
