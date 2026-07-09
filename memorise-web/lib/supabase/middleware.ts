/**
 * Session refresh + route-gate helper (U1, @supabase/ssr).
 *
 * Runs on every request (via middleware.ts). It (1) silently refreshes the Supabase session when
 * the access token is near expiry and syncs the cookies onto the response, and (2) enforces the
 * UX-level gate (layer 1 of the two-layer gate): unauthenticated requests to protected routes are
 * redirected to /login with the intended destination preserved. The FastAPI JWT check + RLS remain
 * the authoritative gate (layer 2) — this redirect is never the sole line of defense (SEC-08/11).
 */
import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Routes reachable without a session. Everything else requires authentication. */
export const PUBLIC_PATHS = ["/login", "/signup", "/reset", "/reset/confirm"] as const;

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { sameSite: "lax", secure: process.env.NODE_ENV === "production" },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // getUser() validates the token with Supabase and triggers a silent refresh near expiry.
  // A failed/expired refresh yields no user -> treated as logged out -> gated below.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublicPath(request.nextUrl.pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
