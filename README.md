# MemoRise

Spaced-repetition learning for any subject — a proven memory engine, light gamification, and an
AI assistant that turns your notes into flashcards. Web-first MVP.

**Architecture (Pattern A):** `Next.js (memorise-web) → FastAPI (memorise-back) → Supabase (memorise-supabase)`.
The frontend calls the backend only; the backend is the single gateway to Supabase (Postgres + Auth).

## Repository layout
```
memorise-web/        Next.js + TypeScript frontend (Vercel)
memorise-back/       FastAPI + Python 3.14 backend (Railway)
memorise-supabase/   SQL-first migrations + config (Supabase)
aidlc-docs/          AI-DLC planning/design docs (not application code)
```

## Prerequisites
- Python 3.14+, Node 20+, and the [Supabase CLI](https://supabase.com/docs/guides/cli).

## Local development
1. **Database (Supabase, local):**
   ```bash
   cd memorise-supabase
   supabase start          # starts local Postgres + Auth
   supabase db reset       # applies migrations/ (profiles + RLS + signup trigger)
   ```
2. **Backend:**
   ```bash
   cd memorise-back
   cp .env.example .env    # fill in values (Supabase URL/keys, JWT secret, DB URL, Anthropic key)
   pip install -e ".[dev]"
   uvicorn app.main:app --reload   # http://localhost:8000  (GET /api/v1/health)
   ```
3. **Frontend:**
   ```bash
   cd memorise-web
   cp .env.example .env.local
   npm install
   npm run dev             # http://localhost:3000
   ```

## Testing
- Backend: `cd memorise-back && pytest` (unit + Hypothesis property-based tests).
- Frontend: `cd memorise-web && npm test` (Vitest + fast-check).
- CI runs everything on every PR and blocks merge on failure (see `.github/workflows/ci.yml`).

## Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md) — GitHub Flow, Conventional Commits, one PR per unit,
squash-merge. **Commits and PRs must not attribute authorship to any AI/assistant.**

## Deployment
- **Frontend → Vercel:** import `memorise-web/`; set `NEXT_PUBLIC_*` env vars; preview deployments per PR.
- **Backend → Railway:** deploy `memorise-back/` (Dockerfile); set backend env vars.
- **Database → Supabase:** apply migrations with `supabase db push` against the project.
