# U1 — Accounts & Auth — Business Logic Model

The four auth flows plus account-gating and session bootstrap, as technology-agnostic step
sequences. Per Q1, **auth actions run frontend-direct against Supabase Auth**; the FastAPI backend
only *verifies* the JWT on protected routes (unchanged from U0). All flows **fail closed** (SEC-15)
and return **generic, non-enumerating** errors.

Legend: `[FE]` frontend/Next.js · `[SB]` Supabase Auth · `[BE]` FastAPI backend · `[DB]` Postgres.

---

## Flow 1 — Signup (US-01, FR-1)

1. `[FE]` User submits `SignupRequest {email, password}` on `/signup`.
2. `[FE]` Client pre-check: email shape valid AND password length ≥ 8. If not → inline error, **no call made**.
3. `[FE→SB]` Call `supabase.auth.signUp({email, password})`.
4. `[SB]` Enforces authoritative policy: min length + **breached-password rejection** (Q4). If violated → returns error.
5. `[SB]` On success: creates `auth.users` row, sends verification email, issues a session.
6. `[DB]` Trigger `handle_new_user()` auto-creates the `profiles` row (U0).
7. `[FE]` `@supabase/ssr` persists the session to httpOnly cookies (Q2).
8. `[FE]` User is **signed in immediately** and redirected to the authenticated placeholder (Q6) — **not blocked** pending verification (Q5).
9. `[FE]` (metric hook) emit `signup` event point — wiring completed in U5/US-26; U1 leaves the call site.
- **Errors:** duplicate/invalid email → generic "couldn't create account" (no enumeration); weak/breached → generic "choose a stronger password". No account created.

---

## Flow 2 — Login (US-02, FR-2)

1. `[FE]` User submits `LoginRequest {email, password}` on `/login`.
2. `[FE→SB]` `supabase.auth.signInWithPassword({email, password})`.
3. `[SB]` Verifies credentials; applies **built-in brute-force rate limiting** (Q3).
4. `[SB]` Success → issues JWT + refresh token; failure → generic error; throttled → `rate_limited`.
5. `[FE]` On success: session → httpOnly cookies; redirect to authenticated placeholder / originally-requested protected route.
- **Errors:** wrong password OR unknown email → **same** generic "invalid credentials" (no user enumeration, SEC-12). Repeated failures → throttled message.

---

## Flow 3 — Logout (US-02, FR-2)

1. `[FE]` User triggers logout.
2. `[FE→SB]` `supabase.auth.signOut()` — **this device only** (Q7).
3. `[SB]` Invalidates the local session/refresh token so it cannot be reused.
4. `[FE]` `@supabase/ssr` clears the auth cookies; redirect to `/login`.
- Subsequent protected requests carry no valid JWT → gated (Flow 5).

---

## Flow 4 — Password reset (US-03, FR-3) — two steps

**4a. Request reset**
1. `[FE]` User submits `PasswordResetRequest {email}` on `/reset`.
2. `[FE→SB]` `supabase.auth.resetPasswordForEmail(email, {redirectTo: /reset/confirm})`.
3. `[FE]` **Always** shows the same generic confirmation regardless of whether the email exists (no enumeration).
4. `[SB]` If the address has an account, sends a reset email with a one-time link.

**4b. Complete reset**
5. `[FE]` User opens the reset link → lands on `/reset/confirm` with a recovery session established by Supabase.
6. `[FE]` Client pre-check on `PasswordUpdate {new_password}` (length ≥ 8).
7. `[FE→SB]` `supabase.auth.updateUser({password})`.
8. `[SB]` Applies password policy (length + breach). Success → password updated; user can log in with it.
- **Errors:** expired/invalid link → generic "reset link is invalid or expired, request a new one".

---

## Flow 5 — Account-gated access (US-04, FR-4) — deny by default

**Frontend gate (UX redirect):**
1. `[FE]` Next.js middleware reads the session cookie on every non-public route.
2. If no valid session → redirect to `/login` (preserving the intended destination). Public routes: `/login`, `/signup`, `/reset`, `/reset/confirm`.

**Backend gate (authoritative — already built in U0):**
3. `[BE]` Every protected API route depends on `get_current_user_id` → verifies JWT signature, expiry, audience server-side.
4. `[BE]` Missing/invalid token → `401` (fail closed). Never trusts client-side hiding.
5. `[DB]` The same JWT is forwarded so RLS also applies (defense in depth — SEC-08/SEC-05).

- **No guest mode:** unauthenticated users cannot create or review anything (US-04 scenario 2).
- Two independent layers (middleware + backend+RLS) — neither is the sole line of defense (SEC-11).

---

## Flow 6 — Session bootstrap (supporting US-02/US-04)

1. `[FE]` On app load, Server Components read the session from the httpOnly cookie via `@supabase/ssr` (Q2).
2. `[FE]` Middleware silently refreshes the token when near expiry using the refresh token.
3. `[FE]` If refresh fails/expired → treat as logged out → Flow 5 redirect.
4. `[FE]` Derives `AuthenticatedUser` for rendering; protected API calls attach the current access token.

---

## Cross-cutting behavior
- **Fail closed (SEC-15):** any auth/verify error denies access; never falls through to an authenticated state.
- **No secrets/PII in logs (SEC-03):** never log passwords, tokens, or reset links; log correlation id + generic outcome only.
- **Generic errors (SEC-12/15):** all user-facing auth errors are non-enumerating and free of internal detail.
- **Metric event call-sites:** signup/login leave hooks for `metric_events` (US-26), fully wired in U5.
