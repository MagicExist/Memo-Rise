# U1 — Accounts & Auth — Code Generation Summary

Delivered on branch `feature/u1-accounts-auth`. All 13 plan steps complete; frontend and backend
gates green locally (see "How to verify"). Tests are generated here; E2E + the DB integration test
execute in Build & Test.

## Stories implemented
- **US-01 Signup** · **US-02 Login/Logout** · **US-03 Password reset** · **US-04 Account-gated access**
- Supporting: **US-24** (responsive/a11y auth screens), **US-26** (metric call-site left in signup, wired in U5)

## Files created (frontend — `memorise-web/`)
- `lib/auth/validation.ts` — pure `normalizeEmail`, `isValidEmail`, `isValidPasswordLength` (PBT P1–P4)
- `lib/auth/errors.ts` — `mapAuthError` → fixed non-enumerating message set (PBT P5)
- `lib/auth/__tests__/validation.pbt.test.ts`, `lib/auth/__tests__/errors.pbt.test.ts`
- `lib/supabase/client.ts` — browser client (`@supabase/ssr`)
- `lib/supabase/server.ts` — server client (reads cookies for SSR)
- `lib/supabase/middleware.ts` — session refresh + route gate (`updateSession`, `isPublicPath`, `PUBLIC_PATHS`)
- `lib/supabase/__tests__/middleware.test.ts` — route-gate tests (node env)
- `middleware.ts` — Next.js middleware entry (runs the gate on all non-static routes)
- `app/(auth)/layout.tsx` + `login`, `signup`, `reset`, `reset/confirm` pages
- `components/features/auth/`: `AuthField`, `LoginForm`, `SignupForm`, `ResetRequestForm`, `ResetConfirmForm`, `LogoutButton`
- `components/features/auth/__tests__/auth-forms.test.tsx` — component tests (mocked Supabase/router)
- `app/(app)/layout.tsx` — authenticated shell (server-side session gate)
- `app/(app)/page.tsx` — minimal "You're signed in" placeholder (Q6; U5 replaces)
- `e2e/auth.spec.ts` — Playwright happy paths (executed in Build & Test)

## Files modified
- `memorise-web/package.json` (+ `package-lock.json`) — added `@supabase/ssr`, `@supabase/supabase-js`
- `memorise-web/vitest.config.ts` — exclude `e2e/**`
- `memorise-web/tsconfig.json` — exclude `e2e`
- `memorise-web/eslint.config.mjs` — ignore build output + auto-generated + `e2e/**`
- `memorise-back/app/core/security.py` — CSP `connect-src` widened to the configured Supabase origin (`build_csp`, middleware `__init__`)
- `memorise-back/app/main.py` — pass `connect_src=[settings.supabase_url]` to the middleware
- `memorise-supabase/supabase/config.toml` — Auth settings as config-as-code (Q1); local ports set to `5532x`

## Files created (backend / supabase / docs)
- `memorise-back/tests/test_security_headers.py` — CSP tests
- `memorise-supabase/README.md` — auth config-as-code + dashboard-fallback checklist
- `memorise-supabase/supabase/tests/signup_profile_test.sql` — AR-17 pgTAP integration test (Build & Test)
- Root `README.md` — auth section + updated architecture note

## Local-setup fixes made while bringing the stack up (post-generation)
- **Supabase layout fix:** moved `config.toml` + `migrations/` + `tests/` into `memorise-supabase/supabase/`
  (the directory layout the Supabase CLI actually reads — the previous flat layout was silently ignored,
  so the CLI ran with built-in defaults). `supabase start` now reads our config.
- **Custom local ports (`5532x`):** set in `config.toml` so MemoRise's local stack runs alongside another
  local Supabase project (Orion/etl-local) without port collisions.
- **Local `.env` files created** (gitignored): `memorise-back/.env` + `memorise-web/.env.local` wired to the
  local stack. Verified: backend boots, `/api/v1/health` → ok, CSP advertises the Supabase origin;
  `profiles` table present after `supabase start`.

## Files removed
- `memorise-web/app/page.tsx` + `app/page.test.tsx` — the U0 scaffold landing at `/` is superseded by
  the gated `(app)` placeholder (deny-by-default, US-04).

## How to verify (run locally)
- Frontend: `cd memorise-web && npm test && npx tsc --noEmit && npx eslint . && npx prettier --check .`
- Backend: `cd memorise-back && uv run --extra dev pytest && uv run --extra dev ruff check app tests && uv run --extra dev mypy app`
- Latest local run: frontend **29 tests pass**, tsc/eslint/prettier clean; backend **7 tests pass**, ruff/mypy clean.

## Security (Baseline) notes
- Generic non-enumerating errors (AR-4), edge validation (AR-18), least-privilege CSP (SEC-04/06),
  two-layer gate (SEC-08/11), fail-closed (SEC-15), no secrets/PII in logs, dep pinned + in CI audit/SBOM.

## Review flags (deliberate, for reviewer attention)
1. **Cookie `httpOnly`:** with frontend-direct auth the browser client sets the session cookies, so
   they are `SameSite=Lax` + `Secure`(prod) but **not `httpOnly`** (JS-set cookies can't be). The NFR
   design described `httpOnly`; achieving it would require moving token-setting to a server route/action.
   Flagged for a decision (accept for MVP vs. add server-side token exchange).
2. **CSP location:** per the approved design the CSP `connect-src` touch is on the **backend**
   (`SecurityHeadersMiddleware`), which governs backend API responses. The CSP that governs the
   *browser's* connect-src is the one on the Next.js document responses; if strict browser-side CSP is
   desired it should also be set on the frontend (e.g. `next.config` headers). Not in this unit's plan.
3. **E2E/integration execution deferred:** Playwright runner + dep and local-Supabase execution of
   `e2e/auth.spec.ts` and `signup_profile_test.sql` are set up and run in **Build & Test** (not silently skipped).
