# U1 — Accounts & Auth — NFR Design Patterns

How U1's NFR requirements become concrete, technology-aware patterns. U1 **inherits** U0's patterns
unchanged and **adds** the cookie-session and two-layer-gate patterns below. Decisions: SameSite=Lax
(Q1), specific Supabase URL in CSP `connect-src` (Q2).

---

## Inherited from U0 (unchanged — referenced, not re-defined)
RLS per table · JWT verification (defense in depth) · deny-by-default routing · security headers
(CSP/HSTS/nosniff/frame-deny/referrer) · CORS allowlist · in-process SlowAPI rate limiter ·
structured logging + correlation id · fail-closed config + global error handler + safe external calls ·
PBT harness (Hypothesis/fast-check) · CI merge gates · supply-chain (lock files, scans, SBOM).
See `construction/u0-foundation/nfr-design/nfr-design-patterns.md`.

---

## U1 security patterns (new / specialized)

| Pattern | Design | Requirement |
|---|---|---|
| **Cookie-based SSR session** | `@supabase/ssr` stores the access + refresh tokens in **httpOnly + Secure + SameSite=Lax** cookies. Browser JS cannot read them (XSS-resistant); server components read them for SSR. | U1-SEC-3, U1-SESS-1/2, Q1/Q2(Q2 layer below) |
| **`SameSite=Lax` cookies** | Chosen (Q1) so email/reset-link top-level navigations carry the session while cross-site subrequests do not — CSRF-resistant without breaking email flows. | Q1, U1-SEC-3 |
| **CSP widened to Supabase (least-privilege)** | Extend U0's `default-src 'self'` with `connect-src 'self' https://<project-ref>.supabase.co` (exact project origin from env, Q2) so the browser can reach the Supabase Auth/REST API and nothing broader. No `unsafe-inline`/`unsafe-eval`. | SEC-04/06, Q2 |
| **Two-layer account gate** | (1) Next.js `middleware.ts` reads the session cookie and redirects unauthenticated users away from protected routes (UX). (2) FastAPI `get_current_user_id` + RLS authoritatively reject unauthenticated/unauthorized API access. Neither is the sole line of defense. | U1-SEC-4, AR-12/13, SEC-08/11 |
| **Silent token refresh** | Middleware refreshes the ~1h access token via the refresh token before expiry; refresh failure ⇒ treated as logged out ⇒ redirect. | U1-SESS-1, Flow 6 |
| **Delegated brute-force + password policy** | Rate limiting, breached-password rejection, and adaptive hashing are Supabase Auth responsibilities (config, not app code); MVP uses Supabase defaults. | U1-SEC-1/5, AR-1/2/7 |
| **Non-enumerating, fail-closed responses** | All auth outcomes mapped to a fixed generic message set via `lib/auth/errors.ts`; any error denies access. | U1-SEC-6, AR-4/10/15 |
| **Input validation at the edge** | Pure `lib/auth/validation.ts` (email shape + password length) short-circuits before any network call. | U1-SEC-7, AR-18 |

## U1 reliability / performance patterns
| Pattern | Design | Requirement |
|---|---|---|
| **Fail-closed auth** | Every Supabase/verify call has explicit error handling; app never enters an authenticated state on error (inherits U0 global handler). | U1-REL-1, SEC-15 |
| **Best-effort latency** | No SLA gate; client validation avoids needless round-trips; latency observable via logs. | U1-PERF-1/2, Q3 |
| **Best-effort verification email** | Send failures never block signup (Supabase-side). | U1-REL-2, AR-5/6 |

## Not applicable (documented)
- **Scalability patterns** — auth is Supabase-managed; SlowAPI single-instance MVP assumption inherited; no U1 scaling triggers. N/A.
- **Resilience patterns (circuit breakers, retries/backoff, HA/DR)** — Resiliency Baseline OFF. N/A.
- **Caching patterns** — no auth data warrants caching in U1. N/A.

## Security compliance touchpoints
SEC-04 (CSP tightened for Supabase, no unsafe-inline) · SEC-05 (edge validation) · SEC-06 (least-privilege
CSP/CORS) · SEC-08 (two-layer gate) · SEC-11 (isolated auth modules; misuse cases) · SEC-12 (httpOnly/Secure/SameSite,
delegated hashing + rate limit) · SEC-15 (fail closed). SEC-14 alerting deferred (tracked).
