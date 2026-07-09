# U1 — Accounts & Auth — Business Rules

Each rule has an ID, statement, enforcement point, and traceability. Enforcement points reflect the
frontend-direct-Supabase decision (Q1). "Supabase" = enforced by Supabase Auth config/behavior;
"FE" = Next.js; "BE" = FastAPI; "DB" = Postgres/RLS.

| ID | Rule | Enforced at | Traces |
|---|---|---|---|
| **AR-1** | Password must be ≥ 8 characters. | FE pre-check (UX) + **Supabase** (authoritative) | FR-1, SEC-12 |
| **AR-2** | Passwords found on a breached-password list are rejected. | **Supabase** leaked-password protection (HIBP) | FR-1, SEC-12 |
| **AR-3** | Passwords are stored only as adaptive hashes; MemoRise never stores or logs plaintext or password hashes. | **Supabase** (storage) + FE/BE (no logging) | SEC-12, SEC-03 |
| **AR-4** | Signup/login/reset error messages are **generic and non-enumerating** — they never reveal whether an email is registered. | FE (message normalization) | US-01/02/03, SEC-12 |
| **AR-5** | A new user is **signed in immediately** on signup and is **not blocked** pending email verification. | FE + Supabase config (non-blocking) | US-01, Q5 |
| **AR-6** | A verification email is sent on signup (best-effort via Supabase default email); failure to send never blocks signup. | **Supabase** | US-01, Q5 |
| **AR-7** | Repeated failed logins are throttled/temporarily limited. | **Supabase** built-in rate limiting | US-02, SEC-12, Q3 |
| **AR-8** | Login issues a valid session (Supabase JWT); the session is carried in httpOnly + Secure + SameSite cookies. | FE (`@supabase/ssr`) | US-02, SEC-12, Q2 |
| **AR-9** | Logout invalidates the current device's session so it cannot be reused; auth cookies are cleared. | FE + **Supabase** `signOut` | US-02, Q7 |
| **AR-10** | Password reset request **always** returns the same generic confirmation regardless of account existence. | FE | US-03, SEC-12 |
| **AR-11** | A reset link establishes a one-time recovery session; setting a new password re-applies AR-1/AR-2. | **Supabase** + FE | US-03 |
| **AR-12** | **Deny by default:** every non-public route/endpoint requires a valid authenticated session. Public set = login, signup, reset-request, reset-confirm only. | FE middleware + **BE** `get_current_user_id` | US-04, SEC-08 |
| **AR-13** | Object/data access is additionally constrained by RLS keyed to `auth.uid()` (defense in depth); the JWT is forwarded to the DB. | **DB** RLS + BE | US-04, SEC-05/08, NFR-4 |
| **AR-14** | **No guest mode:** unauthenticated users cannot create or review decks/cards. | FE + BE | US-04 |
| **AR-15** | All auth error paths **fail closed** — on any error, access is denied; the app never falls into an authenticated state on failure and never leaks internal details. | FE + BE (global error handler, U0) | US-02, SEC-15 |
| **AR-16** | Auth logs contain a correlation id, level, timestamp, and generic outcome only — **no** passwords, tokens, reset links, or PII. | FE/BE logging (U0 logger) | SEC-03 |
| **AR-17** | Exactly one `profiles` row exists per `auth.users` row (created by the U0 trigger, cascade-deleted). U1 verifies, does not re-create. | **DB** trigger + FK cascade (U0) | US-01, US-28 |
| **AR-18** | Email is validated for shape before any auth call (pragmatic allowlist pattern); invalid emails are rejected client-side. | FE pure validation helper | FR-1, SEC-05 |

---

## Validation summary (SEC-05 input validation)
- **Email:** trimmed, lowercased, matched against a pragmatic shape pattern (FE helper `is_valid_email`; PBT target).
- **Password (client pre-check):** non-empty, length ≥ 8; authoritative checks delegated to Supabase (AR-1/AR-2).
- **Reset email field:** same email validation as signup/login.
- No user-supplied auth input is ever concatenated into a query; all persistence is via Supabase/parameterized paths.

## Misuse / abuse cases considered (SEC-11)
- **Account enumeration** via signup/login/reset responses → mitigated by AR-4/AR-10 (uniform generic responses).
- **Credential stuffing / brute force** → AR-7 (Supabase rate limiting).
- **Weak/breached passwords** → AR-1/AR-2.
- **Token theft via XSS** → AR-8 (httpOnly cookies; tokens not in JS-readable storage).
- **Auth bypass** → AR-12/AR-13 (two independent gates: middleware + backend/RLS).
- **Reset-link replay/expiry** → AR-11 (one-time recovery session, Supabase-managed expiry).
