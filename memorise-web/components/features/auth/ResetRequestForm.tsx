"use client";

import Link from "next/link";
import { useState } from "react";

import { isValidEmail } from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/client";

import { AuthField } from "./AuthField";

/**
 * Password-reset request (U1, Flow 4a / US-03). Always shows the SAME confirmation regardless of
 * whether the address has an account (AR-10 — no user enumeration).
 */
export function ResetRequestForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);

    // Only make the call for well-formed addresses, but reveal nothing either way.
    if (isValidEmail(email)) {
      const supabase = createClient();
      const redirectTo =
        typeof window !== "undefined" ? `${window.location.origin}/reset/confirm` : undefined;
      // Ignore the result deliberately — success and failure look identical to the user.
      await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    }

    setSubmitting(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div data-testid="reset-request-confirmation" className="flex flex-col gap-3">
        <h1 className="text-xl font-semibold">Check your email</h1>
        <p className="text-sm text-gray-600">
          If an account exists for that address, we&apos;ve sent a link to reset your password.
        </p>
        <Link href="/login" data-testid="reset-request-login-link" className="text-sm">
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <form
      data-testid="reset-request-form"
      onSubmit={handleSubmit}
      className="flex flex-col gap-4"
      noValidate
    >
      <h1 className="text-xl font-semibold">Reset your password</h1>
      <AuthField
        id="reset-email"
        label="Email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={setEmail}
      />
      <button
        data-testid="reset-request-submit-button"
        type="submit"
        disabled={submitting}
        className="rounded-md bg-gray-900 px-4 py-2 text-white disabled:opacity-60"
      >
        {submitting ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
