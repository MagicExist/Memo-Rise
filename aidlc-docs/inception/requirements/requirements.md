# MemoRise — Requirements Document

**Phase:** INCEPTION · **Stage:** Requirements Analysis · **Depth:** Comprehensive
**Generated:** 2026-07-05 · **Status:** Awaiting approval

Sources: `inputs/vision.md`, `inputs/tech-environment.md`, and the answered
`requirement-verification-questions.md` (16 decisions). Enabled AI-DLC extensions:
**Security Baseline** and **Property-Based Testing (full)**. Resiliency Baseline is
**not** enabled for the MVP.

---

## 1. Intent Analysis Summary

| Attribute | Assessment |
|---|---|
| **User request** | "Using AI-DLC, start a new project. Read the vision and tech-environment docs, then begin the workflow." (greenfield build of the MemoRise MVP) |
| **Request type** | New Project |
| **Clarity** | Clear — strong vision with explicitly-flagged open questions, now resolved |
| **Scope estimate** | System-wide (Next.js frontend + FastAPI backend + Supabase/Postgres data + Anthropic AI) |
| **Complexity** | Complex (multi-layer, AI integration, gamification math, security-sensitive user data) |
| **Chosen depth** | Comprehensive — detailed requirements with traceability |

---

## 2. Scope

MVP scope is governed by `inputs/vision.md` ("MVP Scope — IN / OUT"). This document
restates the IN scope as testable requirements and records the resolved product
decisions. Everything under the vision's "MVP Scope — OUT" table (AI doubt-solving,
advanced card types, quests/achievements, leaderboards, social, marketplace, native
mobile, offline review, import/export, tags/subdecks, analytics dashboards) is
**out of scope** for this build and is not requirement-tracked here.

### 2.1 Resolved Product Decisions (from verification questions)

| # | Decision | Choice |
|---|---|---|
| Q1 | Pre-signup access | **Account required** from the start (no guest mode) |
| Q2 | Email verification | Send verification email but **do not block** first use |
| Q3 | Interface language | **English only** |
| Q4 | Scheduling algorithm | **SM-2 as-is** (classic documented parameters) |
| Q5 | Recall-rating scale | **Four buttons** — Again / Hard / Good / Easy |
| Q6 | Streak break behavior | **Hard reset to 0** on a missed day |
| Q7 | XP model | **Fixed XP per completed review** |
| Q8 | AI model | **Claude Sonnet** (default), kept **configurable** via env |
| Q9 | AI usage cap | **No enforced cap** for MVP — meter usage only |
| Q10 | Max paste length | **~5,000 characters** per AI generation |
| Q11 | Code location | **Reuse** `memorise-web/`, `memorise-back/`, `memorise-supabase/` |
| Q12 | Billing | **Out of MVP**; AI usage must remain meterable per user |
| Q13 | Mobile | **Responsive web**, usable in phone browsers |
| Q14 | Security extension | **Enforced** (blocking) |
| Q15 | Resiliency extension | **Skipped** |
| Q16 | Property-Based Testing | **Enforced (full)** (blocking) |

### 2.2 Folder Mapping (Q11)

Application code lives in the existing repo folders; documentation stays in `aidlc-docs/`.

| tech-environment.md name | This project uses |
|---|---|
| `web/` (Next.js frontend) | `memorise-web/` |
| `backend/` (FastAPI backend) | `memorise-back/` |
| `supabase/` (migrations + SQL functions) | `memorise-supabase/` |

---

## 3. Functional Requirements

Each requirement has a stable ID, a priority (**M** = MVP-must), and acceptance
criteria (AC). "The system" = MemoRise as a whole (frontend + backend + data).

### 3.1 Accounts & Authentication

**FR-1 — Email/password signup (M)**
A new user can create an account with email and password via Supabase Auth.
- AC1: Signup requires a valid email format and a password meeting the policy in NFR/Security (min 8 chars, checked against breached-password list per SECURITY-12).
- AC2: On success the user is authenticated and lands in the app without a blocking verification step (Q2).
- AC3: A verification email is sent; the account is usable before verification (Q2).

**FR-2 — Login / logout (M)**
A returning user can log in with email/password and log out.
- AC1: Valid credentials return a Supabase-issued JWT session; invalid credentials return a generic error (no user-enumeration; SECURITY-09/15).
- AC2: Logout invalidates the session client-side and the session is not reusable (SECURITY-12).
- AC3: Login endpoints have brute-force protection (lockout / progressive delay / CAPTCHA) (SECURITY-12).

**FR-3 — Password reset (M, assumption)**
A user can request a "forgot password" reset email through Supabase Auth's built-in email.
- AC1: Requesting a reset for any address returns the same generic confirmation (no account enumeration).
- AC2: A valid reset link lets the user set a new password meeting the policy.

**FR-4 — Account-gated access (M)**
All decks, cards, review, and AI features require an authenticated account (Q1 — no guest mode).
- AC1: Unauthenticated requests to protected routes are rejected (deny-by-default; SECURITY-08).

### 3.2 Decks

**FR-5 — Create deck (M)** · **FR-6 — Edit deck (M)** · **FR-7 — Delete deck (M)** · **FR-8 — List decks (M)**
A user can create, rename/edit, delete, and list their own decks.
- AC1 (all): Every deck operation is scoped to the owning user; a user can never read or mutate another user's deck (object-level authorization + RLS; SECURITY-08).
- AC2 (delete): Deleting a deck removes its cards and associated review state (defined cascade behavior).
- AC3 (list): The deck list shows, per deck, the count of cards due today (see FR-16).

### 3.3 Cards

**FR-9 — Create card (M)** · **FR-10 — Edit card (M)** · **FR-11 — Delete card (M)** · **FR-12 — List cards in a deck (M)**
A user can create, edit, delete, and list **basic front/back** cards with simple text formatting.
- AC1: A card belongs to exactly one deck owned by the user.
- AC2: Front and back are text with simple formatting; advanced card types (cloze/image/audio) are out of scope.
- AC3: New cards enter the scheduler as "new/unseen" (see FR-13).
- AC4: Card text fields have enforced maximum lengths (input validation; SECURITY-05).

### 3.4 Spaced-Repetition Scheduling

**FR-13 — SM-2 scheduling (M)**
The system schedules each card using the **SM-2 algorithm with classic documented parameters** (Q4).
- AC1: Each card tracks SM-2 state: ease factor, interval, repetition count, and due date.
- AC2: A recall rating updates the card's SM-2 state and computes the next due date per SM-2 rules.
- AC3: Default parameters (initial ease, minimum ease floor, interval progression) are documented in functional design and are the single source of truth for the math.

**FR-14 — Review session flow (M)**
A review session presents due cards one at a time: **show front → reveal answer → rate recall → reschedule → next card**.
- AC1: The session draws from the "due today" queue for the selected deck (FR-16).
- AC2: The session ends when the queue is exhausted or the user exits.
- AC3: Review sessions are **scoped to a single selected deck**. A combined cross-deck session ("study all due cards across every deck") is **out of MVP scope** (per-deck only, matching the vision); it is a candidate for a later phase.

**FR-15 — Recall rating (M)**
On reveal, the user rates recall with **four buttons: Again / Hard / Good / Easy** (Q5).
- AC1: Each button maps to a defined SM-2 quality value; the mapping is documented in functional design.
- AC2: Rating a card triggers the atomic `rate_card` transaction (FR-20).

**FR-16 — "Due today" queue (M)**
Per deck, the system exposes the set of cards due for review today.
- AC1: A card is "due" when its due date ≤ the current date (user's effective day).
- AC2: New/unseen cards are included per the scheduler's new-card policy (documented in design).

### 3.5 Gamification

**FR-17 — XP for reviews (M)**
Completing a review awards a **fixed amount of XP regardless of rating** (Q7).
- AC1: XP is awarded once per completed review and accumulates on the user's profile.
- AC2: The XP amount is a single documented constant (tunable in design, not per-rating).

**FR-18 — Levels (M)**
The user has a level derived from accumulated XP.
- AC1: The XP→level mapping is a documented, deterministic function.
- AC2: Level is displayed on the dashboard (FR-21).

**FR-19 — Daily streak with hard reset (M)**
The system tracks a daily streak counter that increments on a day with ≥1 completed review and **hard-resets to 0 when a day is missed** (Q6).
- AC1: Completing at least one review on a new calendar day increments the streak.
- AC2: If a full day passes with no completed review, the streak resets to 0 (no grace/freeze).
- AC3: The streak counter is visible on the dashboard.
- AC4: Streak day boundaries use a single documented timezone rule (see Open Item OI-1).

**FR-20 — Atomic review-rating transaction (M)**
Rating a card performs *reschedule card + award XP + update streak* as **one atomic transaction** via a Postgres RPC function (e.g. `rate_card`), per tech-environment §4.
- AC1: All three effects succeed together or none apply (no partial updates).
- AC2: The operation is safe under retry (see PBT-04 idempotency consideration for the review-submit path).

### 3.6 AI Card-Generation Assistant

**FR-21 — Generate draft cards from pasted text (M)**
A user can paste text/notes and the assistant returns a set of draft front/back cards using **Claude Sonnet** via the `anthropic` SDK (Q8).
- AC1: Input is capped at **~5,000 characters** (Q10); longer input is rejected with a clear message before any AI call (SECURITY-05).
- AC2: The assistant returns up to ~20 draft cards (fewer for short input) — assumption A1.
- AC3: The Anthropic model is **configurable** (env/setting) with Sonnet as the default (Q8).
- AC4: User-pasted content is treated as **data, not instructions**, and is never interpolated so it can override the system prompt (tech-environment §5; SECURITY-11).
- AC5: The user may **optionally specify a target number of cards** to generate; the result is at most that number and always ≤ the ~20-card maximum. If no target is given, the assistant chooses (up to the max). Fewer requested cards reduce per-call cost.

**FR-22 — Review, edit, accept drafts (M)**
Draft cards are shown for review; the user edits and explicitly accepts before anything is saved.
- AC1: No generated card is persisted until the user accepts it.
- AC2: Accepted cards are saved into a user-chosen deck as normal cards (then follow FR-9…FR-16).

**FR-23 — Graceful degradation on AI failure (M)**
If generation is slow, fails, or returns malformed output, the flow degrades gracefully back to **manual card creation** (vision risk; tech-environment §5).
- AC1: AI errors/timeouts surface a friendly message and a path to create cards manually.
- AC2: Malformed AI output is validated/rejected without crashing the flow (fail closed; SECURITY-15).

**FR-24 — Per-user AI usage metering (M)**
Every AI generation is attributable to the requesting user and recorded, even though **no cap is enforced** in the MVP (Q9, Q12; tech-environment §3 forward-looking constraint).
- AC1: Each AI call records at minimum: user ID, timestamp, and a usage measure (e.g. request count / token estimate).
- AC2: No hard limit blocks generation in the MVP; the data model supports adding a cap later without redesign.

### 3.7 Dashboard & Interface

**FR-25 — Dashboard (M)**
A clean dashboard shows the user's decks, per-deck due counts, and current streak / level / XP.
- AC1: First meaningful data (decks, due counts) loads via Next.js Server Components / native fetching (tech-environment §2).

**FR-26 — Fast onboarding to first review (M)**
Onboarding is deliberately simple, targeting the first completed review within ~5 minutes of signup (vision success metric).
- AC1: A new user can go signup → create/generate a deck → complete one review without leaving a guided path.

**FR-27 — English-only UI (M)**
All UI copy is in English (Q3); no language toggle in the MVP.

**FR-28 — Responsive web UI (M)**
The UI is responsive and usable in a phone browser (Q13); native apps remain out of scope.

### 3.8 Success-Metric Event Logging

**FR-29 — Metric events logged to Supabase from day one (M, assumption A4)**
The system records the events needed to compute the vision's success metrics, into Supabase tables (no dedicated analytics tool in MVP).
- AC1: Logged events include at least: signup, first review completed, review completed, streak state, AI deck created, and AI card accepted vs discarded.
- AC2: Events carry a timestamp and user reference sufficient to compute time-to-first-review, day-7 return, streak length, AI adoption, and cards-kept ratio.

---

## 4. Non-Functional Requirements

**NFR-1 — Architecture (Pattern A)**: Frontend calls **only** the FastAPI backend; FastAPI is the single gateway to Supabase (`Next.js → FastAPI → Supabase`). No direct frontend→Supabase calls. (tech-environment §4)

**NFR-2 — API contract**: REST over HTTP with JSON, all routes prefixed `/api/v1/...`, request/response validated by Pydantic schemas. (tech-environment §4/§5)

**NFR-3 — Service-layer convention**: Business logic (scheduling, XP/streak, AI orchestration) lives in a testable service layer, not in route handlers. (tech-environment §4)

**NFR-4 — Data ownership**: SQL-first migrations via Supabase CLI own the schema; SQLModel is a typed query layer only; multi-step atomic writes use Postgres RPC functions. (tech-environment §1/§4)

**NFR-5 — Performance (review loop)**: The review loop uses client-side caching / optimistic updates (TanStack Query) so rating a card feels immediate; the dashboard first paint uses server-side data loading. (tech-environment §2) *(Targets refined in NFR Design.)*

**NFR-6 — Usability / onboarding**: Support the ~5-min-to-first-review and ~70% first-session-completion hypotheses through minimal onboarding friction (FR-26).

**NFR-7 — Cost posture**: Prefer free/low tiers (Vercel/Railway/Supabase); Anthropic is the one pay-per-use cost. The ~5,000-char cap (FR-21) and per-user metering (FR-24) bound AI spend. (tech-environment §3)

**NFR-8 — Observability (application logging)**: Structured application logging with timestamp, correlation/request ID, level, and message; no secrets/PII in logs. (SECURITY-03) *(Note: Resiliency baseline is not enabled; this is the security-driven logging floor, not a full observability program.)*

**NFR-9 — Maintainability / project structure**: Follow the backend and frontend structures in tech-environment §4, mapped to the `memorise-*` folders (§2.2).

**NFR-10 — Accessibility**: Use shadcn/ui (Radix primitives) as the accessible base kit; keep the four rating buttons and review flow keyboard-operable.

**NFR-11 — Testability**: Critical logic (SM-2 scheduling, XP/level/streak math, auth-protected endpoints, AI happy+failure paths) must be unit-testable in isolation; see §6.

**NFR-12 — Version Control & Development Workflow**:
- **Branching**: GitHub Flow — `main` is always releasable; work happens on short-lived feature branches, one per unit (e.g. `feature/u0-foundation`, `feature/u1-accounts-auth`).
- **Commits**: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:` …).
- **Pull requests**: one PR per unit (U0…U5); **squash-merge** into `main`; **branch protection** on `main` requiring green CI (tests + PBT + type-check + lint + dependency scan per TST-4 / PBT-H / SEC-8) before merge.
- **Authorship constraint (MANDATORY)**: commits and PRs MUST NOT attribute authorship or co-authorship to any AI/assistant. No `Co-Authored-By` AI trailers, no "generated by" attributions — human authors only. Applies to every commit and PR in this project, including those produced during AI-DLC construction.
- **Repo hygiene**: `.env` gitignored; `.env.example` committed documenting required vars (SEC-10 / SEC-12).
- **Implementation home**: this workflow is a **U0 Foundation deliverable** — `.github/workflows/ci.yml`, branch-protection config, a PR template, `CONTRIBUTING.md`, and commit-message linting (e.g. commitlint) are created in U0 (extends US-29).

---

## 5. Security Requirements (Extension: Security Baseline — ENFORCED)

Derived from the enabled Security Baseline. Each maps to a SECURITY rule ID and is a
blocking constraint at the stages where it applies. Rules with no MVP surface are marked
N/A with rationale.

| ID | Requirement | Rule | Applies |
|---|---|---|---|
| SEC-1 | Encryption at rest (Supabase built-in) and TLS in transit for all traffic. | SECURITY-01 | Yes |
| SEC-2 | Application-level structured logging; no secrets/PII in logs. | SECURITY-03 | Yes |
| SEC-3 | HTTP security headers on HTML-serving endpoints (CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy). | SECURITY-04 | Yes (frontend) |
| SEC-4 | Input validation on every API parameter: type, length/size bounds, format allowlists, parameterized SQL (no string concatenation), body-size limits. Includes the ~5,000-char AI paste cap. | SECURITY-05 | Yes |
| SEC-5 | Least-privilege data access: RLS on every table; service-role key only for genuinely privileged operations, never the default path. | SECURITY-06 | Yes |
| SEC-6 | Application-level access control: deny-by-default auth on all routes; object-level ownership checks (prevent IDOR) layered on top of RLS; server-side JWT validation on every request; CORS restricted to allowed origins (no `*` on authenticated endpoints). | SECURITY-08 | Yes |
| SEC-7 | Hardening: no default credentials; production errors return generic messages (no stack traces/internal details); current supported runtimes (Python 3.14.x, current Next.js). | SECURITY-09 | Yes |
| SEC-8 | Supply-chain: pinned dependencies / lock files committed; dependency vulnerability scanning in CI; no `latest` image tags in production; trusted registries only. | SECURITY-10 | Yes |
| SEC-9 | Secure design: security-critical logic (auth, authorization, AI orchestration) isolated in dedicated modules; defense in depth (validation + authorization + RLS); rate limiting on public-facing endpoints (esp. auth and AI generation); misuse cases considered. | SECURITY-11 | Yes |
| SEC-10 | Authentication & credentials: password policy (≥8 chars, breached-list check), adaptive password hashing (delegated to Supabase Auth), secure/HttpOnly/SameSite session cookies, brute-force protection on login, no hardcoded secrets (env vars only; `.env` gitignored, `.env.example` documents vars). | SECURITY-12 | Yes |
| SEC-11 | Integrity: safe handling of untrusted AI output (validate before use, no unsafe deserialization); SRI on any external CDN scripts; auditable critical data changes. | SECURITY-13 | Partial (MVP) |
| SEC-12 | Exception handling & fail-safe defaults: explicit error handling on all external calls (DB, Anthropic API, I/O); fail closed; resource cleanup; generic user-facing errors; global top-level error handler. | SECURITY-15 | Yes |
| — | Access logging on load balancers / API gateways / CDN. | SECURITY-02 | **N/A** — MVP uses managed hosting (Vercel/Railway/Supabase) without self-managed network intermediaries; platform logging is relied upon. Revisit if a gateway/LB is introduced. |
| — | Restrictive network config (security groups, subnets, NAT). | SECURITY-07 | **N/A** — no self-managed VPC/network in the managed-platform MVP. |
| — | Security alerting / tamper-evident log retention / monitoring dashboards. | SECURITY-14 | **Deferred** — dedicated monitoring/error tooling is deferred in tech-environment §3; minimum app logging (SEC-2) applies now. Flagged for pre-scale hardening. |

### 5.1 AI-Specific Safety (tech-environment §5)
- SEC-AI-1: User-pasted content treated as data, never as instructions (FR-21 AC4; SECURITY-11).
- SEC-AI-2: AI failures degrade gracefully to manual creation (FR-23; SECURITY-15).
- SEC-AI-3: AI usage attributable per user (FR-24; supports future paid-tier limits).

---

## 6. Testing & Property-Based Testing Requirements (Extension: PBT — ENFORCED, FULL)

Testing posture follows tech-environment §6 (lean for MVP: unit-heavy on critical logic,
targeted integration, happy-path E2E). Full PBT enforcement adds the following, mapped to
PBT rule IDs (details produced in Functional Design and Code Generation):

| ID | Requirement | Rule |
|---|---|---|
| TST-1 | Unit tests on all critical logic: SM-2 scheduling, XP/level/streak math, auth-protected endpoints, AI happy + failure paths. | tech-env §6 |
| TST-2 | Targeted integration tests on core FastAPI endpoints against a test DB (decks, cards, review, AI generation). | tech-env §6 |
| TST-3 | One happy-path E2E: signup → create/generate deck → complete a review. | tech-env §6 (Playwright) |
| TST-4 | CI runs the full test suite on every PR; failing tests block merge; type-check + lint block merge; coverage is not a hard gate. | tech-env §6 |
| PBT-A | Testable properties identified per unit during Functional Design (round-trip, invariant, idempotence, oracle, etc.) and documented. | PBT-01 |
| PBT-B | Round-trip property tests where an inverse exists (e.g. card/AI-draft (de)serialization, request/response schema round-trips). | PBT-02 |
| PBT-C | Invariant property tests for SM-2 (e.g. ease never below the documented floor; interval/due-date monotonic per rating rules) and gamification (XP is non-negative and only increases; level is monotonic in XP; streak invariants). | PBT-03 |
| PBT-D | Idempotency property tests where operations claim idempotency (e.g. safe re-submit of a review-rating; normalization of pasted text). | PBT-04 |
| PBT-E | Oracle tests where a simple reference exists (e.g. SM-2 reference implementation vs. the service implementation). | PBT-05 |
| PBT-F | Stateful property tests for stateful flows (e.g. sequences of reviews/ratings against a model of card+streak+XP state), or documented N/A. | PBT-06 |
| PBT-G | Domain-specific generators (valid cards, ratings, review sequences, bounded pasted text) — not raw primitives. | PBT-07 |
| PBT-H | Shrinking enabled and seed-based reproducibility; seeds logged on failure; PBT included in CI. | PBT-08 |
| PBT-I | PBT frameworks selected & pinned: **Hypothesis** (Python/backend), **fast-check** (TypeScript/frontend). | PBT-09 |
| PBT-J | PBT complements, not replaces, example-based tests; business-critical paths keep explicit example tests; PBT-found failures become permanent regression examples. | PBT-10 |

---

## 7. Traceability to Vision Success Metrics

| Vision metric | Supporting requirements |
|---|---|
| Time signup → first review (~5 min) | FR-26, FR-1, FR-21/22, NFR-6 |
| First-session review completion (~70%) | FR-14/16, FR-26, NFR-5 |
| Day-7 return (~40%) | FR-19 (streak), FR-25, FR-29 |
| Avg active streak (~5 days) | FR-19, FR-29 |
| Decks created via AI (~50%) | FR-21/22, FR-29 |
| AI cards kept (~60%) | FR-21 (Sonnet for quality/cost balance), FR-22, FR-29 |
| Recall accuracy trend ↑ | FR-13/15, FR-29 |

---

## 8. Assumptions (recorded — object at the approval gate to change)

- **A1**: AI generation returns up to ~20 draft cards per request (fewer for short input), shown for review/edit/accept before saving.
- **A2**: AI failures/timeouts degrade gracefully to manual card creation (also FR-23).
- **A3**: Password reset ("forgot password") is in MVP scope via Supabase Auth email (FR-3).
- **A4**: Success-metric events are logged to Supabase tables from day one; no dedicated analytics tool (FR-29).
- **A5**: "Sonnet configurable" — the exact Sonnet model ID is set via environment/config so it can be swapped without a code change; Sonnet is the launch default (and can be upgraded to Opus or downgraded to Haiku without a code change).

## 9. Open Items for Later Stages (not blocking approval)

- **OI-1**: Streak/day-boundary timezone rule (UTC vs. user-local) — to fix in Functional Design (affects FR-19).
- **OI-2**: Exact SM-2 parameters and the four-button → quality-value mapping — Functional Design.
- **OI-3**: Concrete XP constant and XP→level curve — Functional Design.
- **OI-4**: Rate-limit thresholds for auth and AI endpoints (SEC-9) — NFR Design.
- **OI-5**: Whether to enable a minimal security-event alerting slice before scale (SECURITY-14) — NFR/Infra Design.

---

## 10. Key Requirements Summary

MemoRise MVP is a **single-user, account-gated, English-only, responsive web** spaced-repetition
app on the **Next.js → FastAPI → Supabase** stack. It delivers: email/password accounts
(non-blocking verification), full deck/card CRUD for basic front/back cards, an **SM-2**
scheduler with a **four-button** review loop, **fixed-XP** gamification with levels and a
**hard-reset** daily streak, and an **AI card-generation assistant** (Claude **Sonnet**, ~5,000-char
input cap, per-user metering, graceful fallback to manual). Billing is out of scope but AI usage
is meterable. The **Security Baseline** and **full Property-Based Testing** extensions are
enforced as blocking constraints; the **Resiliency Baseline** is not enabled for the MVP.
