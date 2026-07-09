import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

/**
 * Authenticated shell (U1). Server-side session check — gate layer 1 (server), defense in depth
 * with the middleware. If there is no session, redirect to /login before rendering anything.
 * (The FastAPI JWT check + RLS remain the authoritative gate for data — layer 2.)
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <div className="min-h-screen">{children}</div>;
}
