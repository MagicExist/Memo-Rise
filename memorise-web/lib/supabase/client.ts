/**
 * Browser Supabase client (U1, @supabase/ssr).
 *
 * Used by client components for the frontend-direct auth flows (sign in / sign up / reset /
 * sign out). Reads/writes the session via cookies so the server can also see it (cookie-based
 * SSR session — see lib/supabase/server.ts and middleware.ts).
 */
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // SameSite=Lax (Q1): session rides top-level navigations (email/reset links) but not
      // cross-site subrequests. Secure in production only so local http dev still works.
      cookieOptions: { sameSite: "lax", secure: process.env.NODE_ENV === "production" },
    },
  );
}
