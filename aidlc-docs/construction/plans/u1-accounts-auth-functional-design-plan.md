# U1 — Accounts & Auth — Functional Design Plan

**Unit:** U1 — Accounts & Auth · **Stage:** Functional Design (Construction) · **Depends on:** U0 (complete)
**Stories:** US-01 (signup), US-02 (login/logout), US-03 (password reset), US-04 (account-gated access)
**Traceability:** FR-1…FR-4, SEC-6, SEC-10, SEC-12, SEC-15

**Status:** Questions answered 2026-07-06 (all recommended option A). Artifacts generated. Awaiting stage approval.

---

## Context recap (what U0 already provides — do NOT rebuild)

- **JWT verification / deny-by-default** — `memorise-back/app/api/v1/deps.py` (`get_current_user_id`): verifies the Supabase HS256 JWT server-side on every protected route. This already satisfies the US-04 "unauthenticated access blocked" guard mechanism.
- **`profiles` table + RLS** — `memorise-supabase/migrations/0001_init_profiles.sql`: own-row `select`/`update` policies; no direct user `insert`/`delete`.
- **Signup → profile link** — `migrations/0002_profiles_signup_trigger.sql`: `handle_new_user()` trigger auto-creates a `profiles` row on every `auth.users` insert. **U1's "link profiles to auth users on signup" data task is therefore already done** — U1 only needs to confirm/verify it, not re-implement it.
- **Core middleware** — structured logging (no PII), global fail-closed error handler, security headers, CORS allowlist, SlowAPI rate limiter (`app/core/*`).
- **Frontend shell** — Next.js app router scaffold, `lib/api/client.ts` typed FastAPI client.

**So U1's remaining functional scope is:** the auth *flows* (signup / login / logout / password-reset), the `app/(auth)` pages + session bootstrap, and the deny-by-default wiring on the frontend (route protection / redirect-to-login).

---

## Decisions (answers)

| Q | Decision | Choice |
|---|---|---|
| Q1 Auth path | **Frontend-direct** — client calls Supabase Auth directly; FastAPI only verifies JWT | A |
| Q2 Session | **`@supabase/ssr` cookies** — httpOnly+Secure+SameSite, middleware refresh, SSR reads | A |
| Q3 Brute-force | **Supabase built-in** rate limiting (no custom lockout in MVP) | A |
| Q4 Password | **Supabase built-in** leaked-password protection + min length; light client pre-check | A |
| Q5 Email verify | **Send but don't gate** access; no custom SMTP in U1 (Supabase default) | A |
| Q6 Landing | **Minimal authenticated placeholder** + protected-route redirect; real dashboard = U5 | A |
| Q7 Logout | **This device only** (local `signOut`) | A |
| Q8 PBT-01 | **Minimal surface** — property test the pure input-validation helper; flows = "no PBT (delegated I/O)" | A |

---

## Functional Design Plan (checkboxes)

Artifacts under `aidlc-docs/construction/u1-accounts-auth/functional-design/`:

- [x] **Analyze unit context** — stories US-01…04, application-design (AuthRouter, UserService), U0 primitives
- [x] **Resolve open decisions** — 8 questions answered (all option A); no contradictions/ambiguities
- [x] **`domain-entities.md`** — auth DTOs + `auth.users` ↔ `profiles` (1:1, U0 trigger)
- [x] **`business-logic-model.md`** — the four flows + gating decision path + session bootstrap
- [x] **`business-rules.md`** — password policy, non-enumerating errors, rate-limit, deny-by-default, logout, non-blocking verification — traced to FR/SEC
- [x] **`frontend-components.md`** — `app/(auth)` hierarchy, props/state, validation, redirect middleware, endpoints used
- [x] **`testable-properties.md`** (PBT-01) — validation-helper properties + "no PBT" rationale for flows
- [x] **Extension compliance pass** — Security Baseline + PBT-01 summary in completion message
- [x] **Present completion message** — 2-option (Request Changes / Continue)

---

## Clarifying Questions

## Question 1 — Where do Supabase Auth calls execute? (architectural keystone)
A) **Frontend calls Supabase Auth directly** (Supabase JS client for signup/login/logout/reset); FastAPI only *verifies* the resulting JWT on protected routes. `AuthRouter` is dropped or reduced to a tiny `/auth/me` helper. *(Recommended.)*
B) **Backend proxy** — frontend → FastAPI `AuthRouter` → Supabase Auth for every auth action.
C) **Hybrid** — login/signup/reset frontend-direct, thin backend session/profile bootstrap.
X) Other

[Answer]: A

## Question 2 — Session storage & SSR strategy in Next.js
A) **`@supabase/ssr` cookie-based sessions** — httpOnly + Secure + SameSite cookies, token refresh via middleware. *(Recommended.)*
B) **Client-side tokens in localStorage**, attached as `Authorization: Bearer`.
X) Other

[Answer]: A

## Question 3 — Brute-force / rate-limit protection on login (US-02, SEC-12)
A) **Rely on Supabase Auth's built-in rate limiting** for the MVP. *(Recommended with Q1=A.)*
B) **Add FastAPI SlowAPI throttling** (only effective if auth proxied).
C) **Both**.
X) Other

[Answer]: A

## Question 4 — Password policy & breached-password check (US-01, SEC-12)
A) **Enable Supabase's built-in leaked-password protection (HIBP) + minimum length**, plus a light client-side pre-check. *(Recommended.)*
B) **Custom validation** layered on Supabase.
X) Other

[Answer]: A

## Question 5 — Email verification scope for the MVP (US-01)
A) **Send the verification email but never gate access on it**; no custom SMTP in U1. *(Recommended.)*
B) Send AND wire SMTP now.
C) Skip verification entirely.
X) Other

[Answer]: A

## Question 6 — Authenticated landing surface (dashboard is U5)
A) **A minimal authenticated placeholder page** + protected-route redirect plumbing. *(Recommended.)*
B) **Build a basic dashboard shell now**.
X) Other

[Answer]: A

## Question 7 — Logout scope (US-02)
A) **The current device's session only** (local `signOut`). *(Recommended.)*
B) **All sessions globally**.
X) Other

[Answer]: A

## Question 8 — PBT-01 stance for U1
A) **Document U1 as minimal PBT surface** — property test the pure validation helper; flows marked "No PBT (delegated I/O)". *(Recommended.)*
B) Additionally add PBT for a backend-side validation helper.
X) Other

[Answer]: A
