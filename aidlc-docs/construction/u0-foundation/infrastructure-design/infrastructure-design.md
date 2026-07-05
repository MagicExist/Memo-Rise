# U0 Foundation — Infrastructure Design

Maps the logical components to actual managed services. Platforms fixed by `tech-environment.md §3`.

## Logical component → infrastructure mapping
| Logical component | Infrastructure | Notes |
|---|---|---|
| Next.js frontend | **Vercel** (Hobby/free) | Server Components + preview deployments per PR |
| FastAPI backend | **Railway** (low-cost) | Single container instance for MVP |
| PostgreSQL + Auth | **Supabase** (free) | DB, RLS, Auth (JWT), built-in transactional email |
| AI card generation | **Anthropic API** | Pay-as-you-go; `AICardService` only (U4) |
| Rate limiting | In-process (SlowAPI) | No external cache (Redis disallowed) |
| Logging | Platform stdout/log streams | Structured JSON; Sentry deferred |
| CI/CD | **GitHub Actions** | Tests + PBT + type-check + lint + dep-scan + SBOM |

## Not provisioned in MVP (deferred / disallowed)
- Supabase Storage (text-only MVP), dedicated email (Supabase Auth covers it), Sentry/product analytics — **deferred**.
- AWS/GCP/Azure, alternative hosts, external Redis/queues — **disallowed** by tech-env.

## Configuration & secrets
| Secret / config | Where |
|---|---|
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` (default Sonnet), AI caps | Railway variables (backend) |
| Supabase URL + anon/service keys, DB connection string, JWT/JWKS | Railway variables (backend); anon key + URL also in Vercel env (frontend) |
| CI secrets | GitHub Actions secrets |
| Local dev | `.env` (gitignored); `.env.example` committed |

- No secrets in the repo; `.env` gitignored; `.env.example` documents required vars (SEC-10/12).
- No `latest` image tags in any production config (SEC-10).

## CI/CD pipeline (GitHub Actions)
On every PR: install (from lock files) → type-check (tsc, mypy) → lint (ESLint/Prettier, Ruff) →
unit/integration tests (pytest, Vitest) → **PBT** (Hypothesis, fast-check; seeds logged) → E2E smoke
(Playwright) → `pip-audit`/`npm audit` → CycloneDX SBOM → commitlint. **Merge blocked on any failure.**
On merge to `main`: Vercel deploys web; Railway deploys backend; Supabase migrations applied via CLI.
