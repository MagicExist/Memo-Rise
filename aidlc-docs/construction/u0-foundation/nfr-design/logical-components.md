# U0 Foundation — Logical Components

Cross-cutting components U0 provides. These are wired once and reused by all feature units (U1–U5).
Placed under `memorise-back/app/core/` and `app/api/v1/deps.py` unless noted.

## Backend cross-cutting components
| Component | Location | Responsibility |
|---|---|---|
| `Settings` | `core/config.py` | Load + validate env at startup (fail closed); expose typed config (`ANTHROPIC_MODEL`, AI caps, Supabase, JWT) |
| `get_current_user_id` (auth dependency) | `api/v1/deps.py` | Verify Supabase JWT server-side; resolve `user_id`; 401 on failure |
| `SecurityHeadersMiddleware` | `core/security.py` | Set CSP/HSTS/X-Content-Type-Options/X-Frame-Options/Referrer-Policy |
| `CORSMiddleware` (config) | `main.py` | Allowlist the web origin only |
| `RateLimiter` (SlowAPI) | `core/security.py` | In-process per-route rate limits; strict presets for auth/AI routes |
| `RequestContext/Logging middleware` | `core/logging.py` | Assign correlation id; emit structured logs; scrub secrets/PII |
| `GlobalErrorHandler` | `core/errors.py` | Catch unhandled exceptions; log + return generic safe response |
| `DB session/engine` | `db/session.py` | Session mgmt; forward user JWT so RLS applies |
| `RPC wrapper base` | `db/rpc.py` | Thin base for calling Postgres RPCs (e.g. `rate_card` in U3) |

## Data foundation components (Supabase)
| Component | Location | Responsibility |
|---|---|---|
| `profiles` migration | `memorise-supabase/migrations/` | Create `profiles` + RLS policies |
| Signup trigger | `memorise-supabase/functions/` (or migration) | Auto-create `profiles` row on new `auth.users` insert |
| RLS policy template | migrations | The reusable enable-RLS + per-op-policy pattern for later tables |

## CI / workflow components
| Component | Location | Responsibility |
|---|---|---|
| CI workflow | `.github/workflows/ci.yml` | Run tests + PBT (seeds logged) + type-check + lint + `pip-audit`/`npm audit` + SBOM; block merge on failure |
| Dependabot config | `.github/dependabot.yml` | Dependency update PRs |
| PR template + CONTRIBUTING | `.github/` | Enforce one-PR-per-unit, Conventional Commits, **no AI authorship** |
| commitlint + hooks | repo root | Validate Conventional Commit messages |
| `.env.example` | each app | Document required env vars (no values) |

## Integration notes
- Feature units add their routers/services on top of these components — they do **not** re-implement auth, logging, error handling, or the RLS pattern.
- Rate-limit presets: tighten later in U1 (auth brute-force, SEC-12) and U4 (AI abuse, SEC-9).
