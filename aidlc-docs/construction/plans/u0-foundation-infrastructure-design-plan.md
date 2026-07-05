# U0 Foundation — Infrastructure Design Plan (CONSTRUCTION)

**Unit:** U0 Foundation & Platform · **Depth:** Light — deployment platforms are fixed by
`tech-environment.md §3`. U0 defines the **shared infrastructure** used by all units.
Reply "approve" when the one question is answered.

---

## 1. Execution Checklist (artifacts to generate)
- [x] `infrastructure-design.md` — service mapping + config/secrets + CI/CD
- [x] `deployment-architecture.md` — topology + environment/promotion flow
- [x] `../shared-infrastructure.md` — shared infra all units inherit (U0 owns this)

## 2. Category evaluation (why most categories need no question)
- **Deployment environment:** Vercel (web), Railway (backend), Supabase (DB/Auth), Anthropic (AI) — **fixed**; AWS/GCP/Azure and alternative hosts **disallowed**. No open Qs.
- **Compute:** Vercel serverless (Next.js) + Railway container (FastAPI) — fixed. No open Qs.
- **Storage:** Supabase Postgres — fixed; Supabase Storage deferred (text-only MVP). No open Qs.
- **Messaging:** none — no queues/external Redis in MVP (disallowed). No open Qs.
- **Networking:** platform-managed HTTPS/TLS; no custom LB/API-gateway; CORS at the app. No open Qs.
- **Monitoring:** app-level structured logging only; Sentry/product-analytics deferred (tech-env §3). No open Qs.
- **Shared infrastructure:** U0 **is** the shared-infra unit → documented in `shared-infrastructure.md`.
- **Environments:** the one genuine decision → Q1.

## 3. Question

### Question 1 — Environment strategy
A) **Single production** environment + automatic **Vercel preview deployments** per PR + **local dev** (Supabase CLI `supabase start`) *(recommended: simplest, free-tier friendly, matches SQL-first local testing)*
B) Add a **dedicated persistent staging** environment (separate Supabase project + Railway env) — more realistic pre-prod, more setup/cost
X) Other
[Answer]: A

## 4. Answers Summary
- **Q1 = A** Single production + Vercel preview deployments per PR + local dev (Supabase CLI)
