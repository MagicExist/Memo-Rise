# U0 Foundation — NFR Design Patterns

How U0's NFR requirements are realized as concrete, technology-aware patterns. These patterns are
inherited by every later unit.

## Security patterns
| Pattern | Design | Rule |
|---|---|---|
| **RLS per table** | Each table: `enable row level security` + per-op policies `... = auth.uid()`; ownership via `user_id` or FK chain | SEC-5/6 |
| **JWT verification (defense in depth)** | FastAPI dependency verifies the Supabase JWT (signature/exp/iss/aud) server-side on every protected route; the same JWT is forwarded to Supabase so RLS also applies at the DB | SEC-6 |
| **Deny-by-default routing** | Routes require auth unless explicitly marked public | SEC-6 |
| **Security headers** | Middleware sets CSP (`default-src 'self'`), HSTS (1y), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin` on HTML responses | SEC-4/SECURITY-04 |
| **CORS allowlist** | Explicit allowed origins (the Vercel web origin); never `*` on authenticated endpoints | SEC-6 |
| **Rate limiting** | **In-process SlowAPI** (in-memory), per-route limits; strict on auth (U1) and AI (U4) endpoints; single-instance MVP assumption documented | SEC-9 |
| **Secrets** | Env vars only; `.env` gitignored; `.env.example` committed; no hardcoded secrets; managed via GitHub Actions/Vercel/Railway | SEC-10/12 |

## Reliability / error-handling patterns
| Pattern | Design | Rule |
|---|---|---|
| **Fail-closed config** | Settings validated at startup; missing/invalid → abort boot | SEC-15 |
| **Global error handler** | Top-level handler logs (with correlation id) + returns generic client message; no stack traces | SEC-15 |
| **Safe external calls** | Every DB/Anthropic/IO call wrapped with explicit error handling + resource cleanup; fail closed | SEC-15 |

## Observability patterns
| Pattern | Design | Rule |
|---|---|---|
| **Structured logging** | JSON logs: timestamp, correlation id, level, message; no secrets/PII | SEC-2 |
| **Correlation id** | Assigned per request (middleware), threaded through logs | SEC-2 |

## Testing / supply-chain patterns
| Pattern | Design | Rule |
|---|---|---|
| **PBT harness** | Hypothesis (Py) + fast-check (TS); shrinking on; seeds logged on failure; PBT in CI | PBT-08/09 |
| **CI merge gates** | tests + PBT + type-check + lint + dep-scan must pass; coverage not gated | tech-env §6 |
| **Supply chain** | Lock files committed; Dependabot + `pip-audit` + `npm audit`; CycloneDX SBOM; no `latest` tags | SEC-8/10 |

> Not applicable (Resiliency Baseline off): circuit breakers, retries/backoff, multi-AZ, autoscaling, DR.
