# U0 Foundation — Tech Stack Decisions

Confirms the stack (from `tech-environment.md`) and locks the CI/tooling choices U0 must set up.
Concrete versions are pinned in lock files during Code Generation.

## Application stack (confirmed, per tech-environment)
| Layer | Choice |
|---|---|
| Frontend | Next.js (App Router) + React + TypeScript; Tailwind; shadcn/ui; TanStack Query |
| Backend | FastAPI on Python 3.14.x; SQLModel (query layer); Pydantic |
| Data | Supabase PostgreSQL; SQL-first migrations via Supabase CLI; RLS; Postgres RPC (`rate_card`) |
| Auth | Supabase Auth (JWT verified in FastAPI) |
| AI | Anthropic Python SDK (`anthropic`); model configurable, default Claude Sonnet |
| Hosting | Vercel (web), Railway (backend), Supabase (DB/Auth) |

## Testing tooling
| Purpose | Tool |
|---|---|
| Backend unit/integration | `pytest` + FastAPI `TestClient` |
| Frontend unit/component | `Vitest` + React Testing Library |
| End-to-end | `Playwright` (happy-path scaffold) |
| Property-based (Python) | **Hypothesis** |
| Property-based (TS) | **fast-check** |

## CI / quality tooling (U0 sets these up)
| Purpose | Choice |
|---|---|
| CI provider | GitHub Actions (aligns with GitHub Flow) |
| Merge gates | tests + PBT (seeds logged) + type-check + lint + dependency scan must pass |
| Python lint/format | Ruff (lint + format) |
| Python type-check | mypy |
| TS lint/format | ESLint + Prettier |
| TS type-check | `tsc --noEmit` |
| Commit lint | commitlint (Conventional Commits) |
| Dependency scanning | **Dependabot** + `pip-audit` (Python) + `npm audit` (JS) |
| SBOM | **CycloneDX** generated in CI (SEC-10) |
| Secrets | GitHub Actions secrets (CI) + Vercel/Railway env vars (runtime); `.env` gitignored; `.env.example` committed |

## Decisions resolved this stage
- **Q1 = A:** Dependabot + `pip-audit` + `npm audit`.
- **Q2 = A:** Generate a CycloneDX SBOM in CI from the start (SEC-10 fully satisfied — no exception needed).

## Notes
- No `latest` container/image tags in production configs (SEC-10).
- Lock files (`package-lock.json` / `uv.lock` or `requirements.txt` pinned) committed (SEC-8/10).
