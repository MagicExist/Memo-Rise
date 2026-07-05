# MemoRise — Shared Infrastructure

Owned by **U0 Foundation** and inherited by every later unit (U1–U5). Units build on these; they do
not re-provision or re-implement them.

## Shared platform services
| Service | Role | Shared by |
|---|---|---|
| Vercel | Frontend hosting + preview deployments | all UI work (U1–U5) |
| Railway | FastAPI backend hosting | all backend work |
| Supabase | Postgres + Auth (+ Auth email) | all data + auth |
| Anthropic API | AI generation | U4 |
| GitHub Actions | CI/CD + quality gates | all units |

## Shared backend building blocks (from U0)
- `Settings`/config loader (validated, fail-closed)
- `get_current_user_id` JWT auth dependency
- Security headers + CORS allowlist middleware
- In-process rate limiter (SlowAPI)
- Structured logging + correlation-id middleware
- Global error handler (fail-closed, generic errors)
- DB session/engine (JWT-forwarding) + RPC wrapper base

## Shared data conventions (from U0)
- SQL-first migrations (Supabase CLI); RLS enabled + per-op policies on every table keyed to `auth.uid()`.
- `profiles` base table + signup trigger.

## Shared workflow (from U0)
- GitHub Flow (feature branch per unit) · Conventional Commits · one PR per unit · squash-merge to protected `main`.
- CI merge gates: tests + PBT (seeds logged) + type-check + lint + `pip-audit`/`npm audit` + CycloneDX SBOM.
- **Mandatory:** no AI author/co-author attribution on any commit or PR.
- Secrets in env only; `.env` gitignored; `.env.example` committed.

## Per-unit responsibilities on top of shared infra
- Each unit adds its tables (with RLS following the shared pattern), routes/services/domain, frontend
  components, and tests (incl. PBT where applicable) — reusing all shared building blocks above.
