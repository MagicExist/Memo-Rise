"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AUTH_MESSAGES, mapAuthError } from "@/lib/auth/errors";
import { isValidEmail, isValidPasswordLength } from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/client";

import { AuthField } from "./AuthField";

/**
 * Signup form (U1, Flow 1 / US-01). On success the user is signed in immediately and sent to the
 * authenticated area — verification is non-blocking (AR-5/AR-6), so we never gate on it here.
 */
export function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!isValidEmail(email)) {
      setError(AUTH_MESSAGES.signup_failed);
      return;
    }
    if (!isValidPasswordLength(password)) {
      setError(AUTH_MESSAGES.weak_password);
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({ email: email.trim(), password });

    if (authError) {
      setError(mapAuthError(authError, "signup").message);
      setSubmitting(false);
      return;
    }

    // Metric hook (US-26) — call-site left for U5 to wire: emit "signup".
    router.replace("/");
    router.refresh();
  }

  return (
    <form
      data-testid="signup-form"
      onSubmit={handleSubmit}
      className="flex flex-col gap-4"
      noValidate
    >
      <h1 className="text-xl font-semibold">Create your account</h1>
      <AuthField
        id="signup-email"
        label="Email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={setEmail}
      />
      <AuthField
        id="signup-password"
        label="Password (at least 8 characters)"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={setPassword}
      />
      {error ? (
        <p data-testid="signup-error" role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : null}
      <button
        data-testid="signup-submit-button"
        type="submit"
        disabled={submitting}
        className="rounded-md bg-gray-900 px-4 py-2 text-white disabled:opacity-60"
      >
        {submitting ? "Creating account…" : "Sign up"}
      </button>
      <p className="text-sm text-gray-600">
        Already have an account?{" "}
        <Link href="/login" data-testid="signup-login-link">
          Log in
        </Link>
      </p>
    </form>
  );
}
