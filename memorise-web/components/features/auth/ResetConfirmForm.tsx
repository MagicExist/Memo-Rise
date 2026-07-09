"use client";

import Link from "next/link";
import { useState } from "react";

import { AUTH_MESSAGES, mapAuthError } from "@/lib/auth/errors";
import { isValidPasswordLength } from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/client";

import { AuthField } from "./AuthField";

/**
 * Complete a password reset (U1, Flow 4b / US-03). Relies on the recovery session established by
 * the email link. Expired/invalid links map to a generic message (AR-11).
 */
export function ResetConfirmForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!isValidPasswordLength(password)) {
      setError(AUTH_MESSAGES.weak_password);
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.updateUser({ password });

    if (authError) {
      setError(mapAuthError(authError, "reset").message);
      setSubmitting(false);
      return;
    }

    setDone(true);
  }

  if (done) {
    return (
      <div data-testid="reset-confirm-done" className="flex flex-col gap-3">
        <h1 className="text-xl font-semibold">Password updated</h1>
        <p className="text-sm text-gray-600">You can now log in with your new password.</p>
        <Link href="/login" data-testid="reset-confirm-login-link" className="text-sm">
          Go to log in
        </Link>
      </div>
    );
  }

  return (
    <form
      data-testid="reset-confirm-form"
      onSubmit={handleSubmit}
      className="flex flex-col gap-4"
      noValidate
    >
      <h1 className="text-xl font-semibold">Choose a new password</h1>
      <AuthField
        id="reset-new-password"
        label="New password (at least 8 characters)"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={setPassword}
      />
      {error ? (
        <p data-testid="reset-confirm-error" role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : null}
      <button
        data-testid="reset-confirm-submit-button"
        type="submit"
        disabled={submitting}
        className="rounded-md bg-gray-900 px-4 py-2 text-white disabled:opacity-60"
      >
        {submitting ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
