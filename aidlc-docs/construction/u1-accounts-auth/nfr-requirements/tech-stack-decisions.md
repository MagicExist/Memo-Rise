# U1 — Accounts & Auth — Tech Stack Decisions

The application/CI stack is fixed in U0 and **unchanged** by U1. This document records the one new
dependency and the Supabase Auth configuration U1 relies on. Concrete versions are pinned in lock
files during Code Generation (SEC-10).

## No new stack
| Layer | Reuse from U0 |
|---|---|
| Frontend | Next.js App Router + React + TS; Tailwind; shadcn/ui; TanStack Query |
| Backend | FastAPI (Python 3.14.x) — only JWT verification (`get_current_user_id`) is exercised by U1 |
| Auth | **Supabase Auth** (email/password), JWT verified in FastAPI |
| Data | Supabase Postgres; `profiles` + trigger from U0 |
| PBT | fast-check (TS) — for `lib/auth` validation helpers |

## New dependency (U1)
| Package | Purpose | Rule |
|---|---|---|
| `@supabase/ssr` (+ `@supabase/supabase-js`) | Cookie-based SSR sessions in Next.js (browser + server clients, middleware refresh) — Q2 | SEC-12 |

- Added to `memorise-web/package.json`; pinned in `package-lock.json` (SEC-8/10).
- No new backend dependency (JWT verification via existing `pyjwt` from U0).

## Supabase Auth configuration (settings, not code)
| Setting | Value (MVP) | Decision |
|---|---|---|
| Email/password provider | Enabled | US-01/02 |
| Minimum password length | ≥ 8 | Q4 / AR-1 |
| Leaked-password protection (HIBP) | **Enabled** | Q4 / AR-2 |
| Email confirmations | Sent, **non-blocking** (prod default email); local dev keeps confirmation off | Q5 / AR-5/6 |
| Rate limiting | **Supabase defaults** (login + email sends) | Q2 / AR-7 |
| Access token TTL | ~1h (default), refresh via middleware | Q1 / U1-SESS-1 |
| Session persistence | Persistent (default) | Q1 / U1-SESS-2 |
| Reset link expiry | Supabase default | Q5 / AR-11 |
| Cookie attributes | httpOnly + Secure + SameSite (via `@supabase/ssr`) | Q2 / U1-SEC-3 |

> These are environment/config settings applied in the Supabase project (documented for Infrastructure
> Design + Build & Test); they are not application source code.

## Decisions resolved this stage
- **Q1 = A:** Supabase default session TTL, persistent (no "remember me").
- **Q2 = A:** Supabase default rate limits (thresholds not custom-tuned for MVP).
- **Q3 = A:** Best-effort performance/availability; no formal SLA gate.
- **Q4 = A:** Security alerting deferred to Operations; structured logs + Supabase auth logs now.
