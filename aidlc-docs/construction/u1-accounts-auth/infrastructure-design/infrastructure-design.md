# U1 — Accounts & Auth — Infrastructure Design

**Depth:** Light. U1 introduces **no new infrastructure**. It runs entirely on the shared
infrastructure U0 provisioned (`construction/shared-infrastructure.md`). Auth is Supabase-managed.
The only infrastructure-relevant work is **configuration**: Supabase Auth settings (managed
as config-as-code, Q1), the Supabase origin env vars, and the new `@supabase/ssr` dependency.

---

## Logical component → infrastructure mapping
All U1 logical components (from `nfr-design/logical-components.md`) land on **existing** infrastructure:

| U1 logical component | Runs on | New infra? |
|---|---|---|
| Browser/Server Supabase clients (`lib/supabase/*`) | Vercel (Next.js runtime) — bundled with the frontend | No |
| `middleware.ts` route gate + session refresh | **Vercel Middleware** (existing Next.js runtime) | No |
| Auth validation / error mapper (`lib/auth/*`) | Vercel (frontend bundle) | No |
| Auth UI (`app/(auth)/*`, `components/features/auth/*`) | Vercel (Next.js) | No |
| Authed shell + placeholder (`app/(app)/*`) | Vercel (Next.js SSR) | No |
| JWT gate `get_current_user_id` (reused) | Railway (existing FastAPI container) | No |
| `SecurityHeadersMiddleware` CSP touch | Railway (existing) — one env-driven value | No |
| Supabase Auth (login/signup/reset, tokens, email) | **Supabase** (existing project) — managed service | No |
| Transactional verification/reset email | Supabase Auth built-in email (existing) | No |
| `profiles` table + RLS + signup trigger | Supabase Postgres (existing, U0 migrations) | No |

**Net infrastructure change for U1: none.** Only configuration + one frontend dependency.

## Supabase Auth configuration management (Q1 = A — config-as-code)
Supabase Auth project settings are declared as **version-controlled config** and applied via the
Supabase CLI, consistent with U0's SQL-first migration workflow. Dashboard is a documented fallback
only for settings `config.toml` does not support.

| Auth setting | Source of truth | Notes |
|---|---|---|
| Site URL / redirect (`additional_redirect_urls`) | `memorise-supabase/config.toml` → `[auth]` | Env-driven per environment (local vs prod origin) |
| Email confirmations (non-blocking) | `config.toml` → `[auth.email] enable_confirmations` | Verification is non-blocking (Flow, AR-5/6) |
| Password min length + breached-password (HIBP) check | `config.toml` → `[auth.password]` | U1-SEC-1/5; Supabase defaults where sensible |
| Rate limits (sign-in/sign-up/verify) | `config.toml` → `[auth.rate_limit]` | U1-SEC-1; Supabase defaults (per NFR Requirements) |
| Session / JWT TTLs (access ~1h + refresh) | `config.toml` → `[auth]` / `[auth.sessions]` | U1-SESS-1/2; Supabase defaults |
| Email templates (confirm/reset) | `config.toml` → `[auth.email.template.*]` (fallback: dashboard) | Minimal MVP templates |

- Settings not expressible in `config.toml` are recorded in a short `memorise-supabase/README` checklist and set once in the dashboard (documented, not click-ops-by-default).
- No secrets in `config.toml`; sensitive values referenced via `env(...)`.

## Configuration & secrets (U1 deltas only — inherits U0's secret model)
| Secret / config | Where | New in U1? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel env (frontend) + `.env` local; documented in `.env.example` | Frontend now uses them directly (frontend-direct auth) |
| `SUPABASE_URL` (project origin for CSP `connect-src`) | Railway env (backend) + `.env` local | Consumed by `SecurityHeadersMiddleware` (Q2 from NFR Design) |
| Supabase Auth settings (above) | `memorise-supabase/config.toml` (version-controlled) | **New** — config-as-code |
| Cookie attributes (httpOnly/Secure/SameSite=Lax) | `@supabase/ssr` client config (app code, not infra) | New (Q1 NFR Design) |

- Still no secrets in the repo; `.env` gitignored; `.env.example` updated with the new frontend vars (SEC-10/12).
- New dependency `@supabase/ssr` (+ `@supabase/supabase-js`) pinned in `package-lock.json` — flows through U0's existing CI supply-chain gates (audit + SBOM), no infra change.

## CI/CD impact
None structural — U1 rides U0's existing GitHub Actions pipeline unchanged (type-check, lint, unit/integration, PBT, E2E smoke, dep-scan, SBOM). The only additions are U1's own tests/PBT and the new dependency entering the existing audit/SBOM steps. Merge to `main` still deploys Vercel + Railway and applies Supabase changes via CLI (now including `config.toml` auth settings alongside migrations).

## Monitoring (inherited; U1 delta = none)
App-level structured logging with correlation id (U0). Auth latency observable via logs (best-effort, Q3 NFR Requirements). Security alerting (SEC-14) remains **deferred to Operations** — no U1 infra provisioned for it.

## Not provisioned in U1 (deferred / disallowed — unchanged from U0)
- No external mail provider (Supabase built-in email covers verify/reset), no MFA infra (out of MVP scope), no dedicated staging, no external cache/queue, no AWS/GCP/Azure. All per `tech-environment.md` and U0.
