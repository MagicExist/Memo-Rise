"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

/** Log out on this device only (U1, Flow 3 / AR-9: local scope, Q7), then return to /login. */
export function LogoutButton() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleLogout() {
    setSubmitting(true);
    const supabase = createClient();
    await supabase.auth.signOut({ scope: "local" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      data-testid="logout-button"
      type="button"
      onClick={handleLogout}
      disabled={submitting}
      className="rounded-md border border-gray-300 px-4 py-2 text-sm disabled:opacity-60"
    >
      {submitting ? "Logging out…" : "Log out"}
    </button>
  );
}
