# U1 — Accounts & Auth — Infrastructure Design Plan (CONSTRUCTION)

**Unit:** U1 — Accounts & Auth · **Depth:** Light — inherits U0's shared infrastructure
(`construction/shared-infrastructure.md`) unchanged. U1 provisions **no new infrastructure**;
auth is Supabase-managed. The only infra-relevant work is **configuration** (Supabase Auth
settings, env vars for the Supabase origin, the new `@supabase/ssr` dependency).
Reply "approve" when the one question is answered.

---

## 1. Execution Checklist (artifacts to generate)
- [x] `infrastructure-design.md` — component→infra mapping (all inherited) + U1 config/secrets deltas
- [x] `deployment-architecture.md` — how U1 sits on U0's topology (no topology change) + auth-config management + promotion notes
- [x] Extension compliance pass (Security Baseline)
- [x] Present 2-option completion

*(No `shared-infrastructure.md` — U0 owns it; U1 only references it.)*

## 2. Category evaluation (why almost every category needs no question)
- **Deployment environment:** Vercel (web) + Railway (backend) + Supabase (DB/Auth) — **fixed by U0**; unchanged for U1. No open Qs.
- **Compute:** No new compute. Next.js `middleware.ts` runs on Vercel's existing edge/serverless runtime; no new services. No open Qs.
- **Storage:** `profiles` table + RLS reused from U0 (0001/0002); U1 adds no migration. No open Qs.
- **Messaging:** None. Verification/reset email is Supabase Auth's built-in transactional email (no queue, no external mail provider in MVP). No open Qs.
- **Networking:** Platform-managed HTTPS/TLS. The one delta — CSP `connect-src` widened to the specific Supabase project origin — was already decided in **NFR Design Q2**; it is an app config value, applied via the existing `SecurityHeadersMiddleware`. No open Qs.
- **Monitoring:** App-level structured logging inherited from U0; security alerting (SEC-14) deferred to Operations (decided in NFR Requirements). No open Qs.
- **Shared infrastructure:** Inherited from U0 as-is. No open Qs.
- **Auth-configuration management:** the one genuine infrastructure decision → **Q1** (how Supabase Auth settings are managed & reproduced across environments).

## 3. Question

### Question 1 — How to manage Supabase Auth configuration (config-as-code vs dashboard)
U1 relies on several Supabase **project-level Auth settings** (min password length, breached-password/HIBP
check, email-confirmation on/off, rate limits, session/JWT TTLs, redirect URLs, email templates). U0 already
uses the **Supabase CLI** for SQL-first, version-controlled migrations. Where should these Auth settings live?

A) **Config-as-code in `memorise-supabase/config.toml`** (Supabase CLI) wherever supported, version-controlled and applied to local + prod; fall back to the **dashboard** only for settings `config.toml` doesn't cover (documented in a short README). Reproducible, reviewable, matches the existing SQL-first/CLI approach. *(Recommended — SEC-10/12 spirit, IaC-consistent.)*
B) **Dashboard-only (click-ops)** — configure Auth settings manually in the Supabase console per environment; document the required values in a checklist. Simpler now, but not version-controlled and easy to drift.
X) Other

[Answer]: A

## 4. Answers Summary
- **Q1 = A** Config-as-code in `memorise-supabase/config.toml` (Supabase CLI), version-controlled and applied to local + prod; dashboard fallback only for settings `config.toml` doesn't cover.
