# U1 — Accounts & Auth — Code Generation Plan (CONSTRUCTION · Part 1)

**Unit:** U1 — Accounts & Auth · **Stories:** US-01 (signup), US-02 (login/logout), US-03 (password reset), US-04 (account-gated access); supporting US-24 (responsive/a11y auth screens), US-26 (leave metric call-sites only).
**This plan is the single source of truth for U1 Code Generation.** Part 2 executes these steps in order, marking each `[x]` immediately on completion.

## Context
- **Workspace root:** `/home/johhan/Documents/program/MemoRise`
- **Project type:** Greenfield, multi-folder: `memorise-web/` (bulk of U1), `memorise-back/` (one config touch), `memorise-supabase/` (auth config-as-code).
- **Code location rule:** application/config code → workspace root; markdown summaries → `aidlc-docs/construction/u1-accounts-auth/code/`.
- **Dependencies:** U0 (complete) — reuses `get_current_user_id` JWT gate, `SecurityHeadersMiddleware`, logging/error/CORS/rate-limit core, `profiles` table + signup trigger, CI pipeline, `lib/api/client.ts`.
- **Entities owned:** none new — reuses U0's `profiles` (+ RLS + trigger). No new migration.
- **Architecture:** frontend-direct auth against Supabase (`@supabase/ssr` cookie sessions); backend only *verifies* JWTs. No new FastAPI auth endpoints.
- **Design inputs:** functional-design (flows 1–6, frontend-components, business-rules, testable-properties), nfr-design (patterns + logical-components), infrastructure-design (config-as-code auth settings, CSP env origin).

## Extension obligations (enabled)
- **Security Baseline:** generic non-enumerating errors (AR-4); httpOnly+Secure+SameSite=Lax cookies; CSP `connect-src` = specific Supabase origin (env-driven, no `unsafe-*`); two-layer gate; fail-closed; no secrets/PII in logs; new dep pinned + scanned.
- **Property-Based Testing (PBT-01..10):** properties P1–P5 on the pure `lib/auth` helpers via **fast-check**, domain generators, shrinking on, seeds logged in CI; example-based boundary tests alongside; delegated I/O explicitly documented as N/A for PBT.

---

## Generation Steps

### Step 1 — Feature branch, dependency & env setup  [x]
- Cut `feature/u1-accounts-auth` from `main` (per aidlc-state: branch cut at Code Generation).
- `memorise-web/package.json`: add `@supabase/ssr` + `@supabase/supabase-js`; refresh `package-lock.json` (pinned, SEC-8/10).
- `memorise-web/.env.example`: ensure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` documented.
- `memorise-back/.env.example`: ensure `SUPABASE_URL` (CSP origin) documented.
- *Stories:* US-01..04 (enabling)

### Step 2 — Pure auth logic (PBT targets)  [x]
- `memorise-web/lib/auth/validation.ts` — **pure** `isValidEmail()` (trim+lowercase normalize + structural check) and `isValidPasswordLength()` (boundary at 8). No I/O.
- `memorise-web/lib/auth/errors.ts` — `mapAuthError(raw)` → fixed generic, non-enumerating message set (AR-4).
- *Rules:* AR-1/2/4/18 · SEC-12 · *Properties:* P1–P5 targets
- *Stories:* US-01, US-02, US-03

### Step 3 — Pure auth logic tests (PBT + example)  [x]
- `lib/auth/__tests__/validation.pbt.test.ts` — fast-check **P1** (idempotent normalize), **P2** (case/space invariance), **P3** (structural invariant), **P4** (length threshold monotonicity); domain valid/invalid-email + boundary-length generators; seed logged.
- `lib/auth/__tests__/errors.pbt.test.ts` — fast-check **P5** (non-enumeration: injected email/detail never in output; message ∈ allowed set).
- Example-based companions (PBT-10): length 7=false/8=true; known raw errors → generic copy.
- *Story:* US-29 lineage (PBT harness) · executed in Build & Test.

### Step 4 — Supabase SSR session plumbing + route gate  [x]
- `memorise-web/lib/supabase/client.ts` — browser client (`@supabase/ssr`).
- `memorise-web/lib/supabase/server.ts` — server client reading cookies (SSR).
- `memorise-web/lib/supabase/middleware.ts` — session-refresh helper (cookie sync).
- `memorise-web/middleware.ts` — route gate: silent refresh + redirect unauthenticated off protected routes to `/login` (preserve target); public allowlist `/login`,`/signup`,`/reset`,`/reset/confirm` + static.
- Cookies: httpOnly + Secure + **SameSite=Lax** (Q1).
- *Rules:* AR-8/12 · SEC-08/11/12 · *Flows:* 5, 6
- *Stories:* US-02, US-04

### Step 5 — Session/middleware tests  [x]
- Example-based/integration tests: unauth → redirect to `/login` with preserved target; valid session → passes; public routes exempt; refresh-failure treated as logged out. (Mocked Supabase; no pure PBT — documented.)
- *Story:* US-04

### Step 6 — Auth UI: `(auth)` route group + components  [x]
- `app/(auth)/layout.tsx` (centered card); `login/page.tsx`, `signup/page.tsx`, `reset/page.tsx`, `reset/confirm/page.tsx`.
- `components/features/auth/`: `LoginForm`, `SignupForm`, `ResetRequestForm`, `ResetConfirmForm`, `LogoutButton`, `AuthField` (correct `autocomplete`, never logs password).
- Wire to browser client per Flows 1–4; all failures via `mapAuthError`; signup redirects immediately (AR-5, non-blocking verification); reset request always shows identical confirmation (AR-10).
- Responsive, single-column, labelled inputs, visible focus (US-24). Stable `data-testid` on inputs/buttons/forms (e.g. `login-form-submit-button`).
- Leave metric call-sites for signup/login (US-26; wired in U5).
- *Rules:* AR-1/4/5/6/7/9/10/11/15/18 · *Flows:* 1–4
- *Stories:* US-01, US-02, US-03

### Step 7 — Authenticated shell + placeholder  [x]
- `app/(app)/layout.tsx` — server-side session read via `lib/supabase/server.ts`; redirect out if absent (defense in depth with middleware, gate layer 1 server side).
- `app/(app)/page.tsx` — `AuthedPlaceholder` ("You're signed in") + `LogoutButton` (Q6; U5 replaces).
- *Rules:* AR-9/12/13 · *Flow:* 3, 5
- *Stories:* US-02, US-04

### Step 8 — Frontend component tests (mocked Supabase)  [x]
- Vitest + RTL for each form: happy path calls correct Supabase method; failure renders generic copy; signup redirects immediately; reset shows constant confirmation; logout clears + redirects. Assert no email enumeration in rendered errors.
- Placeholder/gate: renders when session present; redirects when absent.
- *Stories:* US-01..04 · executed in Build & Test.

### Step 9 — Backend CSP config touch  [x]
- `memorise-back/app/core/security.py` — widen CSP `connect-src` to `'self' https://<project-ref>.supabase.co` from env (`SUPABASE_URL`, Q2); keep `default-src 'self'`, no `unsafe-inline`/`unsafe-eval`.
- `memorise-back/tests/test_security_headers.py` — assert CSP contains the configured Supabase origin and nothing broader; other headers unchanged.
- *Rules:* SEC-04/06 · *Story:* US-04 (supporting)

### Step 10 — Supabase Auth config-as-code  [x]
- `memorise-supabase/config.toml` — `[auth]`/`[auth.email]`/`[auth.password]`/`[auth.rate_limit]`: email/password provider on; min length ≥ 8; leaked-password (HIBP) on; email confirmations sent + **non-blocking** (local dev confirmations off); Supabase-default rate limits & TTLs; redirect URLs via `env(...)`. No secrets inline.
- `memorise-supabase/README.md` — short checklist of any settings not expressible in `config.toml` (dashboard fallback).
- *Rules:* SEC-10/12 · Q1 (infra) · *Stories:* US-01, US-02, US-03

### Step 11 — Integration & E2E scaffolding  [x]
- Integration test asserting **AR-17** (exactly one `profiles` row per user on signup — U0 trigger) against local Supabase.
- Playwright E2E happy-path specs (TST-1..3): signup→signed-in, login→placeholder, logout→login, gated redirect. Authored here; **executed in Build & Test**.
- *Stories:* US-01, US-02, US-04

### Step 12 — Documentation  [x]
- Update `/README.md`: auth setup (Supabase config-as-code, env vars, running auth locally).
- `aidlc-docs/construction/u1-accounts-auth/code/u1-code-summary.md` — files created/modified with paths, story coverage, how to run/test.
- *Stories:* US-01..04

### Step 13 — Deployment artifacts / config notes  [x]
- Document required env vars on Vercel (`NEXT_PUBLIC_SUPABASE_URL`, anon key) and Railway (`SUPABASE_URL`); note `config.toml` auth settings applied via Supabase CLI in the existing deploy step. No new Docker/host infra (all inherited from U0).
- *Story:* US-04 (supporting)

---

## Story coverage
- **US-01 Signup** → Steps 2, 3, 6, 10, 11, 12
- **US-02 Login/Logout** → Steps 2, 3, 4, 6, 7, 8, 10, 11
- **US-03 Password reset** → Steps 2, 3, 6, 10, 12
- **US-04 Account-gated access** → Steps 4, 5, 7, 8, 9, 11, 13
- **US-24 (a11y/responsive auth screens)** → Step 6
- **US-26 (metric call-sites left, not wired)** → Step 6

## Scope
- **13 steps**; ~25–30 files, overwhelmingly in `memorise-web/` (SSR plumbing, `lib/auth`, `(auth)`/`(app)` routes, auth components, tests), plus 1 backend file touched (CSP) + 1 backend test, and `memorise-supabase/config.toml` + README.
- **No new database migration** (reuses U0 `profiles` + trigger); **no new FastAPI route**.
- Tests (unit, PBT P1–P5, integration, E2E) are **generated here but executed in the Build & Test stage** (after all units).
- Delivered on `feature/u1-accounts-auth`; one PR at unit completion (GitHub Flow, green CI required).

## PBT property summary (PBT-01)
| Property | Target | Type |
|---|---|---|
| P1 idempotent normalize | `isValidEmail` normalize | Idempotence |
| P2 case/space invariance | `isValidEmail` | Invariant |
| P3 structural validity | `isValidEmail` | Invariant |
| P4 length threshold (=8) | `isValidPasswordLength` | Invariant |
| P5 non-enumeration | `mapAuthError` | Invariant |
| round-trip / stateful / oracle | — | **N/A** (documented — delegated I/O) |
