# U0 Foundation — Code Generation Plan (CONSTRUCTION · Part 1)

**Unit:** U0 Foundation & Platform · **Stories:** US-27 (logging), US-28 (RLS), US-29 (CI + version-control workflow)
**This plan is the single source of truth for U0 Code Generation.** Part 2 executes these steps in order.

## Context
- **Workspace root:** `/home/johhan/Documents/program/MemoRise`
- **Project type:** Greenfield, multi-folder (not microservices): `memorise-web/`, `memorise-back/`, `memorise-supabase/`
- **Code location rule:** application/config code → workspace root; markdown summaries → `aidlc-docs/construction/u0-foundation/code/`
- **Dependencies:** none (U0 is the prerequisite for U1–U5)
- **Entities owned:** `profiles` (+ RLS + signup trigger)
- **Depends on prior design:** functional-design, nfr-design, infrastructure-design, shared-infrastructure

## Generation Steps

### Step 1 — Repository scaffolding & root config  [x]
- `/.gitignore` (Python, Node, env, OS), `/README.md` (project overview + run instructions)
- `/.github/pull_request_template.md` (checklist incl. **no AI authorship** reminder)
- `/.github/dependabot.yml` (pip + npm ecosystems)
- `/CONTRIBUTING.md` (GitHub Flow, Conventional Commits, one-PR-per-unit, no-AI-authorship)
- `/commitlint.config.cjs` (Conventional Commits)
- *Story:* US-29

### Step 2 — Backend scaffold & core (`memorise-back/`)  [x]
- `pyproject.toml` (FastAPI, uvicorn, sqlmodel, pydantic, pydantic-settings, pyjwt, anthropic, slowapi, httpx; dev: pytest, hypothesis, ruff, mypy) + pinned lock
- `app/main.py` (app factory, router registration, middleware wiring)
- `app/core/config.py` (`Settings`: `ANTHROPIC_MODEL` default Sonnet, AI caps, Supabase/JWT vars; fail-closed validation)
- `app/core/security.py` (security headers middleware, CORS allowlist, SlowAPI rate limiter)
- `app/core/logging.py` (structured JSON logging + correlation-id middleware; secret scrubbing)
- `app/core/errors.py` (global error handler; generic responses)
- `app/api/v1/deps.py` (`get_current_user_id` — Supabase JWT verification)
- `app/db/session.py` (engine/session, JWT forwarding), `app/db/rpc.py` (RPC wrapper base)
- `app/api/v1/routes/health.py` (`GET /api/v1/health` — smoke endpoint)
- `.env.example`
- *Stories:* US-27 (logging), US-28 (JWT/RLS wiring)

### Step 3 — Backend core unit tests + PBT  [x]
- `tests/test_config.py` (settings validation) + `tests/test_config_pbt.py` (**Hypothesis**: any settings missing a required key → startup validation rejects; PBT-01 property)
- `tests/test_health.py` (health endpoint via TestClient)
- `tests/conftest.py`, Hypothesis profile (seed logging)
- *Story:* US-29 (PBT harness proven)

### Step 4 — Frontend scaffold (`memorise-web/`)  [x]
- Next.js (App Router) + TS skeleton: `package.json` (+ lock), `tsconfig.json`, `next.config.ts`
- Tailwind config + `app/globals.css`; shadcn/ui init; base `app/layout.tsx`, `app/page.tsx`
- `lib/api/client.ts` (typed fetch base calling FastAPI only, Pattern A)
- ESLint + Prettier config; `vitest.config.ts`; fast-check dev dep
- `.env.example` (NEXT_PUBLIC_API_URL, Supabase public vars)
- *Story:* US-29 (frontend toolchain)

### Step 5 — Frontend scaffold test  [x]
- `web` smoke test (Vitest + RTL): base layout renders; example fast-check property test stub
- *Story:* US-29

### Step 6 — Database migrations (`memorise-supabase/`)  [x]
- `migrations/0001_init_profiles.sql`: `profiles` table + `enable row level security` + per-op policies (`auth.uid()`); reusable RLS pattern comment block
- `migrations/0002_profiles_signup_trigger.sql`: trigger on `auth.users` insert → create `profiles` row (defaults xp=0/level=1/streak=0)
- `config.toml` (Supabase CLI local config)
- *Stories:* US-28 (RLS), profile foundation for U3

### Step 7 — CI/CD pipeline & workflow tooling  [x]
- `/.github/workflows/ci.yml`: matrix jobs — backend (ruff, mypy, pytest incl. Hypothesis w/ seed logging, pip-audit), frontend (eslint, prettier check, tsc, vitest, npm audit), commitlint, **CycloneDX SBOM** artifact; merge-blocking
- *Story:* US-29

### Step 8 — Documentation  [x]
- Update `/README.md` (setup: local Supabase, backend, frontend, CI, git workflow)
- `aidlc-docs/construction/u0-foundation/code/u0-code-summary.md` (what was generated, paths, how to run)
- *Story:* US-27/29

### Step 9 — Deployment artifacts  [x]
- `memorise-back/Dockerfile` (pinned base image, non-root) + Railway config
- `memorise-web/` Vercel settings notes; `memorise-supabase/` migration apply notes
- *Story:* US-29

## Story coverage
- **US-27** (structured logging) → Steps 2, 8
- **US-28** (RLS + JWT) → Steps 2, 6
- **US-29** (CI + PBT + dep-scan + SBOM + version-control workflow) → Steps 1, 3, 5, 7, 9

## Scope
- **9 steps**; ~30–35 files across root, `memorise-back/`, `memorise-web/`, `memorise-supabase/`, `.github/`.
- Tests are generated here but **executed in the Build & Test stage** (after all units).
- Automation-friendly: any UI elements get stable `data-testid` (minimal in U0).
