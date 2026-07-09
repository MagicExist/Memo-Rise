# U1 — Accounts & Auth — Logical Components

Components U1 introduces to realize the NFR design, plus the U0 components it reuses. Most auth
"components" are frontend (Q1 = frontend-direct); the backend contributes only the already-built
JWT gate.

---

## New U1 logical components (frontend — `memorise-web/`)

| Component | Location | Responsibility | Realizes |
|---|---|---|---|
| **Browser Supabase client** | `lib/supabase/client.ts` | `@supabase/ssr` browser client for auth calls from client components | Cookie-session pattern |
| **Server Supabase client** | `lib/supabase/server.ts` | Reads session from cookies in Server Components/route handlers (SSR) | Cookie-session, SSR reads |
| **Middleware session helper** | `lib/supabase/middleware.ts` | Refreshes the session and syncs cookies for each request | Silent token refresh |
| **Route gate middleware** | `middleware.ts` | Deny-by-default UX gate: redirect unauthenticated users off protected routes; allow public auth routes | Two-layer gate (layer 1) |
| **Auth validation module** | `lib/auth/validation.ts` | Pure email/password-length predicates (PBT targets P1–P4) | Edge input validation |
| **Auth error mapper** | `lib/auth/errors.ts` | Map raw Supabase errors → fixed generic, non-enumerating messages (property P5) | Non-enumerating/fail-closed |
| **Auth UI components** | `components/features/auth/*`, `app/(auth)/*` | Login/signup/reset/reset-confirm forms + logout; wired to the browser client | Flows 1–4 |
| **Authed shell + placeholder** | `app/(app)/layout.tsx`, `app/(app)/page.tsx` | Server-side session check + minimal "signed in" landing (U5 replaces) | Q6, gate layer 1 (server) |

## Backend (`memorise-back/`) — reused, one config touch
| Component | Location | U1 role |
|---|---|---|
| `get_current_user_id` (JWT gate) | `api/v1/deps.py` | **Reused as-is** — authoritative gate layer 2 for all protected APIs | 
| `SecurityHeadersMiddleware` (CSP) | `core/security.py` | **Config touch:** add `connect-src 'self' https://<project-ref>.supabase.co` (env-driven, Q2) so the browser can reach Supabase |
| SlowAPI limiter, logging, error handler, DB session, CORS | `core/*`, `db/*` | Reused unchanged; auth traffic is frontend-direct so backend auth-route limits are not the primary control in U1 |

## Data (`memorise-supabase/`) — reused from U0
| Component | U1 role |
|---|---|
| `profiles` table + RLS (0001) | Reused; U1 adds a test asserting AR-17 (1 profile per user) |
| Signup trigger (0002) | Reused; guarantees profile creation on signup — no new migration in U1 |

## Configuration components (settings, not code)
| Setting | Where | Value |
|---|---|---|
| Supabase Auth: min length, HIBP, email confirm, rate limits, TTLs | Supabase project config | Per `tech-stack-decisions.md` |
| `NEXT_PUBLIC_SUPABASE_URL` / anon key; backend `SUPABASE_URL` for CSP | `.env` (both apps) | Documented in `.env.example` (SEC-10) |
| Cookie attributes (httpOnly/Secure/SameSite=Lax) | `@supabase/ssr` client config | Q1 |

## Integration notes
- U1 adds **no new backend router** (AuthRouter reduced to nothing / optional `/auth/me`).
- The only backend code change is widening the CSP `connect-src` (one env-driven value); everything else is frontend + Supabase config.
- New frontend dependency `@supabase/ssr` (+ `@supabase/supabase-js`) pinned in `package-lock.json`.
