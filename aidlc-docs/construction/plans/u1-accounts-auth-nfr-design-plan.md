# U1 — Accounts & Auth — NFR Design Plan

**Unit:** U1 — Accounts & Auth · **Stage:** NFR Design (Construction) · **Depends on:** U0
**Inputs:** U1 NFR requirements (approved), U0 NFR design patterns + logical components.

**Note:** U1 inherits U0's realized patterns unchanged (RLS, JWT verification defense-in-depth,
deny-by-default routing, security headers, CORS allowlist, structured logging + correlation id,
fail-closed config/error handling, PBT harness, CI gates). U1 **adds** the cookie-session pattern
(`@supabase/ssr`) and the two-layer account gate. Resiliency Baseline is OFF → no circuit
breakers/retries/HA/DR. The two decisions below are the only genuinely open NFR-design choices.

---

## NFR Design Plan (checkboxes)

- [x] Analyze NFR requirements (U1-SEC-1..10, session, perf, availability)
- [x] Resolve the 2 open NFR-design decisions (Q1=A SameSite=Lax, Q2=A specific Supabase URL)
- [x] `nfr-design/nfr-design-patterns.md` — U1 security/session/reliability patterns (+ inherited references)
- [x] `nfr-design/logical-components.md` — new U1 logical components (SSR clients, middleware gate) + reused U0 components
- [x] Extension compliance pass (Security Baseline)
- [x] Present 2-option completion

---

## Category applicability (per NFR-design rule)
| Category | Applies to U1? | Note |
|---|---|---|
| Resilience patterns | Minimal | Resiliency Baseline OFF; fail-closed + explicit error handling only (inherited) |
| Scalability patterns | N/A | Auth is Supabase-managed; SlowAPI single-instance MVP assumption inherited; no U1 scaling triggers |
| Performance patterns | Minimal | Best-effort MVP (Q3); client validation short-circuits bad input; no caching needed for auth |
| Security patterns | **Yes** | The core of U1 — cookie sessions, two-layer gate, CSP for Supabase origin (below) |
| Logical components | **Yes** | New SSR clients + middleware gate; rest reused from U0 |

---

## Clarifying Questions

## Question 1 — Session cookie `SameSite` attribute
`@supabase/ssr` sets the auth cookies; `SameSite` controls whether they ride along on cross-site navigations (e.g. clicking a link from an email/webmail into the app).

A) **`SameSite=Lax`** — cookies sent on top-level GET navigations (email links, external links work smoothly); blocked on cross-site subrequests. Standard balance for a web app with email flows. *(Recommended.)*
B) **`SameSite=Strict`** — cookies never sent on any cross-site navigation. Marginally stronger CSRF posture, but can cause a "logged out until you click again" feel when arriving from external links.
X) Other

[Answer]: A

## Question 2 — CSP `connect-src` for the Supabase Auth API
U0's CSP is `default-src 'self'`. Because the frontend now calls Supabase Auth **directly** (Q1), the CSP must allow that origin or the calls are blocked. How tightly?

A) **Allow the specific Supabase project URL** (e.g. `https://<project-ref>.supabase.co`) in `connect-src`. Tightest; least-privilege. *(Recommended — SEC-04/06 spirit.)*
B) **Allow the wildcard `https://*.supabase.co`** in `connect-src`. Simpler across environments, but broader than needed.
X) Other

[Answer]: A
