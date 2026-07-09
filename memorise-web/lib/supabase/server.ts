/**
 * Server Supabase client (U1, @supabase/ssr).
 *
 * Used by Server Components / route handlers to read the session from the request cookies for
 * SSR (first-paint auth state and the server-side gate in app/(app)/layout.tsx). Cookie writes
 * from a Server Component are a no-op (Next.js forbids them) — the middleware owns refresh.
 */
import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { sameSite: "lax", secure: process.env.NODE_ENV === "production" },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component (cookies are read-only there). Safe to ignore:
            // the middleware refreshes and persists the session cookies on every request.
          }
        },
      },
    },
  );
}
