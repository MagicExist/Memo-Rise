# MemoRise

Spaced-repetition learning for any subject — a proven memory engine, light gamification, and an
AI assistant that turns your notes into flashcards. Web-first MVP.

**Architecture (Pattern A for data):** `Next.js (memorise-web) → FastAPI (memorise-back) → Supabase (memorise-supabase)`.
For application data the frontend calls the backend only, and the backend is the single gateway to
Supabase Postgres. **Authentication (U1) is frontend-direct:** the browser talks to Supabase Auth
directly via `@supabase/ssr` (cookie-based SSR sessions); the backend independently verifies the
Supabase JWT and RLS enforces row access (two-layer gate).

## Repository layout
```
memorise-web/        Next.js + TypeScript frontend (Vercel)
memorise-back/       FastAPI + Python 3.14 backend (Railway)
memorise-supabase/   SQL-first migrations + config (Supabase)
aidlc-docs/          AI-DLC planning/design docs (not application code)
```

## Prerequisites
- Python 3.14+, Node 20+, **Docker** (for local Supabase), and the [Supabase CLI](https://supabase.com/docs/guides/cli).

## Local development
1. **Database (Supabase, local):**
   ```bash
   cd memorise-supabase       # Supabase project lives in ./supabase/ (config.toml, migrations, tests)
   supabase start             # starts local Postgres + Auth (needs Docker)
   supabase status            # prints the anon key + URLs to put in the .env files
   ```
   Local ports use the **`5532x`** range (API `55321`, DB `55322`, Studio `55323`, Mailpit `55324`)
   so this stack can run alongside another local Supabase project without colliding. Migrations
   (profiles + RLS + signup trigger) are applied automatically on `supabase start`; `supabase db reset`
   rebuilds from scratch.
2. **Backend:**
   ```bash
   cd memorise-back
   cp .env.example .env    # fill from `supabase status`: SUPABASE_URL/keys, JWT secret, DB URL
   uv run uvicorn app.main:app --reload   # http://localhost:8000  (GET /api/v1/health)
   ```
3. **Frontend:**
   ```bash
   cd memorise-web
   cp .env.example .env.local   # set NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY
   npm install
   npm run dev             # http://localhost:3000
   ```

### Authentication (U1)
- Email/password auth (signup, login, logout, password reset) runs frontend-direct against Supabase Auth.
- Routes: `/login`, `/signup`, `/reset`, `/reset/confirm` are public; everything else requires a session.
  Next.js middleware redirects unauthenticated users to `/login`; `app/(app)/` also checks server-side.
- Supabase Auth policy (min length, non-blocking email confirmation, TTLs) is version-controlled in
  `memorise-supabase/config.toml`; breached-password protection + prod redirect URLs are set in the
  dashboard (see `memorise-supabase/README.md`).

## Testing
- Backend: `cd memorise-back && pytest` (unit + Hypothesis property-based tests).
- Frontend: `cd memorise-web && npm test` (Vitest + fast-check; includes the auth validation/error
  properties, the route-gate, and the auth-form component tests).
- End-to-end (`memorise-web/e2e/`, Playwright) and the AR-17 signup-trigger pgTAP test
  (`memorise-supabase/tests/`) run in the Build & Test stage against a local Supabase.
- CI runs everything on every PR and blocks merge on failure (see `.github/workflows/ci.yml`).

## Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md) — GitHub Flow, Conventional Commits, one PR per unit,
squash-merge. **Commits and PRs must not attribute authorship to any AI/assistant.**

## Deployment
No new infrastructure in U1 — it rides U0's platforms (Vercel + Railway + Supabase).
- **Frontend → Vercel:** import `memorise-web/`; set `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`; preview deployments per PR.
- **Backend → Railway:** deploy `memorise-back/` (Dockerfile); set backend env vars including
  `SUPABASE_URL` (drives the CSP `connect-src` Supabase origin).
- **Database/Auth → Supabase:** `supabase db push` applies both SQL migrations **and** the
  `config.toml` Auth settings. Enable breached-password protection and set production redirect URLs
  in the dashboard (see `memorise-supabase/README.md`).
