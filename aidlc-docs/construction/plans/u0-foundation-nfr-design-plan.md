# U0 Foundation — NFR Design Plan (CONSTRUCTION)

**Unit:** U0 Foundation & Platform · **Depth:** Light.
Translates U0 NFR requirements into patterns + logical components. Most patterns are determined by the
Security rules and tech-environment and are NOT re-asked (justification below); one genuine open item.

**How to answer:** pick a letter after each `[Answer]:` (recommended marked). Reply "approve" when done.

---

## 1. Execution Checklist (artifacts to generate)
- [x] `nfr-design-patterns.md` — security/reliability/testing patterns for U0
- [x] `logical-components.md` — cross-cutting components (auth middleware, logging, error handler, rate limiter, CI pipeline)

## 2. Category evaluation (why most categories need no question)
- **Resilience:** Resiliency Baseline not enabled; U0 reliability = fail-closed config + global error handler (already specified). No open Qs.
- **Scalability:** MVP low-scale on managed platforms; no scaling mechanism to design in U0. No open Qs.
- **Performance:** U0 has no user-facing latency surface. No open Qs.
- **Security:** patterns fixed by SEC rules (RLS keyed to `auth.uid()`, server-side JWT verify, deny-by-default, security headers, secrets in env, structured logging). **One** open item → rate-limiting store (Q1).
- **Logical components:** determined (auth dependency, logger, global error handler, rate-limiter middleware, CI pipeline).

## 3. Question

### Question 1 — Rate-limiting implementation (SEC-9; external Redis is disallowed by tech-env)
A) **In-process** rate limiting (e.g. SlowAPI / in-memory) for the MVP; revisit a shared store only if the backend scales to multiple instances *(recommended: no extra infra, matches single-instance Railway + the no-external-cache rule)*
B) **Postgres-backed** rate limiting (a counter table) — shared across instances, slightly more DB overhead
X) Other
[Answer]: A

## 4. Answers Summary
- **Q1 = A** In-process rate limiting (SlowAPI / in-memory) for the MVP; revisit a shared store if scaling to multiple instances
