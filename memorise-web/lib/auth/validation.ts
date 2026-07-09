/**
 * Pure client-side auth input validation (U1, AR-1/2/18).
 *
 * These are deliberately PURE functions (no I/O, no side effects) so they can be exercised by
 * property-based tests (PBT-01 → properties P1–P4). They are a first, non-authoritative gate that
 * short-circuits obviously-bad input before any network call; Supabase Auth enforces the real
 * policy (minimum length + breached-password rejection).
 */

/** Minimum password length. Supabase enforces this authoritatively; we pre-check for UX. */
export const MIN_PASSWORD_LENGTH = 8;

/**
 * Normalize an email for validation: trim surrounding whitespace and lowercase.
 * Idempotent by construction (P1): normalize(normalize(x)) === normalize(x).
 */
export function normalizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

// One "@", a non-empty local part, and a domain with at least one dot and non-empty labels.
// No whitespace anywhere. Intentionally conservative — the authoritative check is server-side.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * True when `input` is a structurally valid email address.
 * Case- and surrounding-whitespace-invariant (P2) because it validates the normalized form.
 */
export function isValidEmail(input: string): boolean {
  return EMAIL_PATTERN.test(normalizeEmail(input));
}

/**
 * True when `input` meets the minimum password length. Boundary is exactly
 * MIN_PASSWORD_LENGTH (P4): length >= 8 → true, length < 8 → false.
 */
export function isValidPasswordLength(input: string): boolean {
  return input.length >= MIN_PASSWORD_LENGTH;
}
