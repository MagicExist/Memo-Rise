/**
 * Auth error mapping (U1, AR-4 / SEC-12 / SEC-15).
 *
 * Every raw Supabase/network error is mapped to a FIXED, generic, non-enumerating message drawn
 * from `AUTH_MESSAGES`. The mapper never echoes the raw error text, the email, or any internal
 * detail — so it can never leak "user not found" / "already registered" style information
 * (property P5). Unknown/unexpected errors fail closed to a generic message.
 */

export type AuthErrorCode =
  | "invalid_credentials"
  | "signup_failed"
  | "weak_password"
  | "rate_limited"
  | "reset_link_invalid"
  | "generic";

/** Which flow raised the error — used only to pick the best generic message, never interpolated. */
export type AuthContext = "login" | "signup" | "reset" | "generic";

export interface AuthError {
  code: AuthErrorCode;
  message: string;
}

/** The complete, fixed set of user-facing auth messages. Nothing outside this set is ever shown. */
export const AUTH_MESSAGES: Record<AuthErrorCode, string> = {
  invalid_credentials: "Invalid email or password.",
  signup_failed: "We couldn't create your account. Please try again.",
  weak_password: "Please choose a stronger password.",
  rate_limited: "Too many attempts. Please wait a moment and try again.",
  reset_link_invalid: "This reset link is invalid or has expired. Please request a new one.",
  generic: "Something went wrong. Please try again.",
};

/** Frozen list of every allowed message — used by callers/tests to assert non-enumeration (P5). */
export const ALLOWED_AUTH_MESSAGES: readonly string[] = Object.freeze(Object.values(AUTH_MESSAGES));

/** Safely read a lowercased string field from an unknown error-like value. */
function readField(raw: unknown, key: string): string {
  if (raw && typeof raw === "object" && key in raw) {
    const value = (raw as Record<string, unknown>)[key];
    if (typeof value === "string") return value.toLowerCase();
    if (typeof value === "number") return String(value);
  }
  return "";
}

/**
 * Map an arbitrary raw error to a safe {@link AuthError}. The returned `message` is ALWAYS a member
 * of {@link ALLOWED_AUTH_MESSAGES} and contains no data derived from `raw` (P5).
 */
export function mapAuthError(raw: unknown, context: AuthContext = "generic"): AuthError {
  const code = readField(raw, "code");
  const status = readField(raw, "status");
  const message = readField(raw, "message");
  const haystack = `${code} ${status} ${message}`;

  const has = (...needles: string[]): boolean => needles.some((n) => haystack.includes(n));

  let resolved: AuthErrorCode;
  if (has("429", "rate", "too many", "over_")) {
    resolved = "rate_limited";
  } else if (has("weak", "pwned", "breach", "leaked", "password should", "min_length")) {
    resolved = "weak_password";
  } else if (has("otp_expired", "expired", "invalid link", "recovery", "reset")) {
    resolved = "reset_link_invalid";
  } else if (has("invalid_credentials", "invalid_grant", "invalid login")) {
    resolved = "invalid_credentials";
  } else {
    // Unknown → fall back to the most appropriate generic for the flow (fail closed).
    resolved =
      context === "login"
        ? "invalid_credentials"
        : context === "signup"
          ? "signup_failed"
          : context === "reset"
            ? "reset_link_invalid"
            : "generic";
  }

  return { code: resolved, message: AUTH_MESSAGES[resolved] };
}
