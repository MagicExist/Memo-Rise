# U1 — Accounts & Auth — NFR Requirements

Non-functional requirements for the auth unit. Auth is **delegated to Supabase** (frontend-direct,
Q1) on managed platforms (Supabase/Vercel/Railway), so the weight is on **security** and **session
management**; performance/availability are best-effort for the MVP (measured, not gated). Decisions
below reflect the four answered questions (all option A).

Legend for source: FD = U1 functional design rule (AR-n), SEC = Security Baseline, U0 = inherited from U0.

---

## Security (Security Baseline — enforced)
| ID | Requirement | Source |
|---|---|---|
| U1-SEC-1 | Passwords: min 8 chars **and** breached-password rejection, enforced authoritatively by Supabase (HIBP leaked-password protection ON); client does a length pre-check only. | SEC-12, AR-1/2 |
| U1-SEC-2 | Credentials never stored or logged by MemoRise; adaptive hashing handled by Supabase; no plaintext/tokens/reset-links in logs. | SEC-12/03, AR-3/16 |
| U1-SEC-3 | Session tokens carried in **httpOnly + Secure + SameSite** cookies via `@supabase/ssr`; not readable by JS (XSS-resistant). | SEC-12, AR-8, Q2 |
| U1-SEC-4 | Deny-by-default: every non-public route/endpoint requires a valid session — Next.js middleware (UX) **and** backend `get_current_user_id` + RLS (authoritative). | SEC-08, AR-12/13 |
| U1-SEC-5 | Brute-force protection on login via **Supabase Auth built-in rate limiting** (default thresholds accepted for MVP — Q2). | SEC-12, AR-7 |
| U1-SEC-6 | All auth responses are **generic / non-enumerating** (signup, login, reset) and **fail closed** on error. | SEC-15/12, AR-4/10/15 |
| U1-SEC-7 | Email/password inputs validated before any auth call (shape + length); no user input concatenated into queries. | SEC-05, AR-18 |
| U1-SEC-8 | Password reset via one-time recovery link with Supabase-managed expiry (default accepted). | SEC-12, AR-11 |
| U1-SEC-9 | Security-critical auth logic isolated in Supabase + dedicated FE modules (`lib/auth`, `lib/supabase`), not scattered. | SEC-11, AR (design) |
| U1-SEC-10 | Security monitoring/alerting on repeated auth failures **deferred to Operations phase**; rely on U0 structured logs + Supabase auth logs now (Q4). SEC-14 = deferred (not N/A) — tracked. | SEC-14, Q4 |

## Session Management (Q1)
| ID | Requirement |
|---|---|
| U1-SESS-1 | Access token ~1h (Supabase default), silently refreshed via Next.js middleware before expiry. |
| U1-SESS-2 | **Persistent** session across browser restarts until explicit logout or refresh-token expiry from inactivity (Supabase defaults). No "remember me" toggle in MVP. |
| U1-SESS-3 | Logout invalidates the **current device** session and clears auth cookies (local `signOut`, AR-9). |

## Performance (Q3 — best-effort, measured not gated)
| ID | Requirement |
|---|---|
| U1-PERF-1 | No hard latency SLA for the MVP; auth latency is bounded by Supabase/Vercel managed platforms. Latency is observable via logs; not an acceptance gate. |
| U1-PERF-2 | Client validation short-circuits obviously invalid input before any network call (avoids needless round-trips). |

## Availability / Reliability (Q3)
| ID | Requirement |
|---|---|
| U1-AVAIL-1 | No formal uptime SLA for the MVP; inherits managed-platform availability. |
| U1-REL-1 | Every auth/external call has explicit error handling; app never enters an authenticated state on failure (fail closed); pasted state (e.g. forms) not lost on transient error where reasonable. | 
| U1-REL-2 | Email verification is best-effort (Supabase default email); a send failure never blocks signup (AR-5/6). |

## Maintainability
| ID | Requirement |
|---|---|
| U1-MNT-1 | Pure validation/error-mapping isolated in `lib/auth/` (testable, PBT targets). |
| U1-MNT-2 | Follows U0 version-control workflow (GitHub Flow, Conventional Commits, one PR for U1, no AI authorship). |
| U1-MNT-3 | Type-check + lint + tests (incl. PBT) run in the existing CI gate on the U1 PR. |

## Usability / Accessibility (US-24)
| ID | Requirement |
|---|---|
| U1-UX-1 | Auth screens mobile-first responsive, large tap targets, labelled inputs, visible focus, English-only copy. |
| U1-UX-2 | Correct `autocomplete` attributes (`email`, `current-password`, `new-password`) for password-manager support. |
| U1-UX-3 | Signup lands the user in the app immediately (no verification wall) for a fast first-run (supports US-23). |

---

## Testing / PBT (enforced)
- PBT framework already selected/installed in U0 (**fast-check** for the TS validation helpers) — PBT-09 satisfied.
- U1 property targets are defined in `functional-design/testable-properties.md` (P1–P5); carried into Code Generation.

## Out of scope for U1 (explicit)
- MFA (SEC-12 says "SHOULD for all users") — not in MVP; Supabase supports enabling later without redesign.
- Custom rate-limit thresholds, formal SLAs, and real-time security alerting — deferred as above.
