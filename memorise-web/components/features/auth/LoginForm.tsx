"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { AUTH_MESSAGES, mapAuthError } from "@/lib/auth/errors";
import { isValidEmail } from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/client";

import { AuthField } from "./AuthField";

/** Login form (U1, Flow 2 / US-02). Frontend-direct against Supabase Auth. */
export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    // Edge pre-check (AR-18/AR-15). Failure reuses the same generic message (no enumeration).
    if (!isValidEmail(email) || password.length === 0) {
      setError(AUTH_MESSAGES.invalid_credentials);
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      setError(mapAuthError(authError, "login").message);
      setSubmitting(false);
      return;
    }

    router.replace(searchParams.get("redirectTo") ?? "/");
    router.refresh();
  }

  return (
    <form
      data-testid="login-form"
      onSubmit={handleSubmit}
      className="flex flex-col gap-4"
      noValidate
    >
      <h1 className="text-xl font-semibold">Log in</h1>
      <AuthField
        id="login-email"
        label="Email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={setEmail}
      />
      <AuthField
        id="login-password"
        label="Password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={setPassword}
      />
      {error ? (
        <p data-testid="login-error" role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : null}
      <button
        data-testid="login-submit-button"
        type="submit"
        disabled={submitting}
        className="rounded-md bg-gray-900 px-4 py-2 text-white disabled:opacity-60"
      >
        {submitting ? "Logging in…" : "Log in"}
      </button>
      <div className="flex justify-between text-sm text-gray-600">
        <Link href="/reset" data-testid="login-reset-link">
          Forgot password?
        </Link>
        <Link href="/signup" data-testid="login-signup-link">
          Create account
        </Link>
      </div>
    </form>
  );
}
