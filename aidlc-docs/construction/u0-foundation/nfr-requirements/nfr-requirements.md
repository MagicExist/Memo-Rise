# U0 Foundation — NFR Requirements

Non-functional requirements for the platform unit. U0 is infrastructure, so performance/availability
targets are light (managed platforms); the weight is on security, testing/PBT, supply chain, and maintainability.

---

## Security (Security Baseline — enforced)
| ID | Requirement | Rule |
|---|---|---|
| U0-SEC-1 | Structured logging with timestamp/correlation-id/level; no secrets or PII in logs | SEC-2/SECURITY-03 |
| U0-SEC-2 | RLS enabled + per-op policies on every table; JWT forwarded so RLS applies | SEC-5/6 |
| U0-SEC-3 | Deny-by-default routing; server-side JWT verification on every protected route | SEC-6 |
| U0-SEC-4 | Secrets only in env vars; `.env` gitignored; `.env.example` committed; no hardcoded secrets | SEC-10/12 |
| U0-SEC-5 | Supply chain: pinned deps + lock files committed; **Dependabot + `pip-audit` + `npm audit`** in CI; no `latest` image tags; **CycloneDX SBOM** generated in CI | SEC-8/10 |
| U0-SEC-6 | Global error handler; fail-closed; generic client errors (no stack traces) | SEC-15 |
| U0-SEC-7 | Rate-limiting hooks available at the app/gateway layer (thresholds set per-unit in NFR Design; U1 auth, U4 AI) | SEC-9 |
| — | Encryption at rest/in transit relies on managed platforms (Supabase/HTTPS) | SEC-1 (inherited) |
| — | SEC-4 (input validation), SEC-11 (secure design), SEC-13/14 | applied in feature units (U1–U5) / partially deferred |

## Testing & Property-Based Testing (PBT — enforced, full)
| ID | Requirement | Rule |
|---|---|---|
| U0-TST-1 | Test runners configured: `pytest`+TestClient (backend), `Vitest`+RTL (frontend), `Playwright` (E2E scaffold) | tech-env §6 |
| U0-TST-2 | PBT frameworks installed + wired: **Hypothesis** (Python), **fast-check** (TS) | PBT-09 |
| U0-TST-3 | CI runs full suite incl. PBT on every PR; **seeds logged**; shrinking enabled; flaky PBT investigated not suppressed | PBT-08 |
| U0-TST-4 | CI is merge-blocking: any failed test / type-check / lint blocks merge; coverage not gated | tech-env §6 |

## Maintainability
| ID | Requirement |
|---|---|
| U0-MNT-1 | Project structure per tech-environment §4, mapped to `memorise-web/back/supabase` |
| U0-MNT-2 | Type-check (TS `tsc`, Python type checker) + lint/format run in CI |
| U0-MNT-3 | Version-control workflow per NFR-12 (GitHub Flow, Conventional Commits, one PR/unit, no AI authorship) |

## Cost (tech-env §3)
| ID | Requirement |
|---|---|
| U0-COST-1 | Prefer free/low tiers (Vercel/Railway/Supabase free at low usage); CI on free GitHub Actions minutes |

## Performance / Availability / Reliability
| ID | Requirement |
|---|---|
| U0-PERF-1 | N/A (light) — U0 provisions the platform; feature-level perf targets belong to U3 (review loop) and U5 (dashboard) |
| U0-REL-1 | Fail-closed config validation at startup; global error handler; explicit error handling on all external calls |

> **Resiliency Baseline is NOT enabled** — no HA/DR/RTO/RPO targets defined for the MVP.
