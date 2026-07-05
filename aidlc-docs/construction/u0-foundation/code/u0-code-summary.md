# U0 Foundation — Code Generation Summary

Generated per `aidlc-docs/construction/plans/u0-foundation-code-generation-plan.md`.
All application/config code is in the workspace root; this doc is the markdown summary.

## Files created

### Root / workflow (Step 1, 7)
- `.gitignore`, `README.md`, `CONTRIBUTING.md`
- `.github/pull_request_template.md`, `.github/dependabot.yml`, `commitlint.config.cjs`
- `.github/workflows/ci.yml` — backend + frontend + commitlint + SBOM jobs (merge-blocking)

### Backend `memorise-back/` (Step 2, 3, 9)
- `pyproject.toml`, `Dockerfile`, `.env.example`
- `app/main.py` — app factory wiring all middleware + `/api/v1` router
- `app/core/config.py` — `Settings` (fail-closed env validation)
- `app/core/security.py` — security headers, CORS allowlist, SlowAPI rate limiter
- `app/core/logging.py` — JSON logging + correlation-id middleware
- `app/core/errors.py` — global fail-closed error handler
- `app/api/v1/deps.py` — `get_current_user_id` (Supabase JWT verification)
- `app/api/v1/routes/health.py` — `GET /api/v1/health`
- `app/db/session.py`, `app/db/rpc.py` — engine/session + RPC wrapper base
- `tests/` — `test_config.py`, `test_config_pbt.py` (Hypothesis), `test_health.py`, `conftest.py`

### Frontend `memorise-web/` (Step 4, 5)
- `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`
- `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `lib/api/client.ts`
- `eslint.config.mjs`, `.prettierrc`, `vitest.config.ts`, `vitest.setup.ts`, `.env.example`
- `app/page.test.tsx` — Vitest render test + fast-check property test

### Data `memorise-supabase/` (Step 6)
- `migrations/0001_init_profiles.sql` — `profiles` + RLS (the reusable pattern)
- `migrations/0002_profiles_signup_trigger.sql` — auto-create profile on signup
- `config.toml` — Supabase CLI local config (non-blocking email confirmation)

## Story coverage
- **US-27** (structured logging) — `app/core/logging.py`, error handler
- **US-28** (RLS + JWT) — migrations RLS policies, `deps.py`, `db/session.py`
- **US-29** (CI + PBT + dep-scan + SBOM + version-control workflow) — `ci.yml`, tests, root workflow files

## Follow-ups (deliberate)
- Lock files (`package-lock.json`, Python lock) are produced on first `npm install` / dependency
  resolution and must be committed before the first PR (SEC-8/10).
- The RLS JWT-claim forwarding helper in `db/session.py` is stubbed; it is completed in U2 when
  the first user-data tables (decks/cards) are accessed.
- Tests are generated here; they are executed in the **Build & Test** stage (after all units).
- Pin the SBOM GitHub Action to an exact release when wiring CI (SEC-10/13).
